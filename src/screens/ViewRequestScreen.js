import React, { useState, useContext, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  TextInput,
  FlatList,
  ActivityIndicator,
  Button,
  Image,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { RootLayout } from '../navigation/RootLayout';
import { Colors } from '../config';
import { AuthenticatedUserContext } from '../providers';
import { auth, firestore } from '../config';
import {
  collection,
  doc,
  query,
  getDocs,
  getDoc,
  deleteDoc,
  setDoc,
  addDoc,
  serverTimestamp,
  orderBy,
  limit,
} from 'firebase/firestore';


export const ViewRequestScreen = ({ navigation }) => {
    const { userType } = useContext(AuthenticatedUserContext);
    const [modalVisible, setModalVisible] = useState(false); // For decline modal
    const [reason, setReason] = useState('');
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [detailsModalVisible, setDetailsModalVisible] = useState(false); // For details modal
    const [selectedRequestDetails, setSelectedRequestDetails] = useState(null);
  
    // Fetch requests logic
    const fetchRequests = async () => {
      setLoading(true);
      try {
        const currentUser = auth.currentUser;
        if (!currentUser || !currentUser.uid) return;
  
        const q = query(
          collection(
            firestore,
            `professionals/${currentUser.uid}/matchingRequests`
          )
        );
        const querySnapshot = await getDocs(q);
  
        const fetchedRequests = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setRequests(fetchedRequests);
      } catch (error) {
        console.error('Error fetching requests:', error);
      } finally {
        setLoading(false);
      }
    };
  
    useEffect(() => {
      fetchRequests();
    }, []);
  
    // Fetch request details logic
    const fetchRequesterDetails = async (requesterId) => {
      if (!requesterId) return null;
    
      try {
        const userDocRef = doc(firestore, 'users', requesterId);
        const userDoc = await getDoc(userDocRef);
    
        let selfAssessment = null;
        if (userDoc.exists()) {
          const data = userDoc.data();
          const fullName = [
            data.firstName,
            data.middleName,
            data.lastName
          ]
          .filter(Boolean)
          .join(' ');
    
          // Fetch the latest self-assessment log
          const selfAssessmentRef = collection(firestore, `users/${requesterId}/selfAssessment`);
          const selfAssessmentQuery = query(selfAssessmentRef, orderBy('createdAt', 'desc'), limit(1));
          const selfAssessmentSnapshot = await getDocs(selfAssessmentQuery);
    
          if (!selfAssessmentSnapshot.empty) {
            const assessmentDoc = selfAssessmentSnapshot.docs[0];
            selfAssessment = {
              id: assessmentDoc.id,
              ...assessmentDoc.data(),
            };
          }
    
          return { id: userDoc.id, fullName, selfAssessment, ...data };
        } else {
          console.warn('No such user found for ID:', requesterId);
          return null;
        }
      } catch (error) {
        console.error('Error fetching user details:', error);
        return null;
      }
    };
    
  
    
    // Open decline modal
    const openDeclineModal = (request) => {
      setSelectedRequest(request);
      setModalVisible(true);
    };
  
    // Open details modal
    const handleRequestPress = async (item) => {
      setLoading(true);
      const details = await fetchRequesterDetails(item.userId);
      setSelectedRequestDetails(details);
      setDetailsModalVisible(true);
      setLoading(false);
    };
  
    // Decline request logic
    const handleDecline = async () => {
      const currentUser = auth.currentUser;
      if (!currentUser || !selectedRequest?.id) {
        console.error('No user or selected request found.');
        return;
      }
  
      try {
        const matchingRequestDocRef = doc(
          firestore,
          'professionals',
          currentUser.uid,
          'matchingRequests',
          selectedRequest.id
        );
  
        const declinedRequestsRef = doc(
          firestore,
          'professionals',
          currentUser.uid,
          'declinedRequests',
          selectedRequest.id
        );
  
        const requestHistoryRef = collection(
          firestore,
          'professionals',
          currentUser.uid,
          'requestHistory'
        );
  
        const requestDocRef = doc(requestHistoryRef, selectedRequest.id);
        await setDoc(requestDocRef, {
          ...selectedRequest,
          status: 'declined',
          declinedReason: reason,
          declinedAt: serverTimestamp(),
        });
  
        await setDoc(declinedRequestsRef, {
          ...selectedRequest,
          status: 'declined',
          reason: reason,
          declinedAt: serverTimestamp(),
        });
  
        const notificationRef = doc(
          collection(firestore, `notifications/${selectedRequest.userId}/messages`)
        );
        await setDoc(notificationRef, {
          recipientId: selectedRequest.userId,
          message: `Your matching request has been declined. Reason: ${reason}`,
          type: 'matching',
          createdAt: serverTimestamp(),
          isRead: false,
        });
  
        await deleteDoc(matchingRequestDocRef);
        console.log('Request declined and removed successfully!');
        
        setModalVisible(false);
        setReason('');
        fetchRequests();
      } catch (error) {
        console.error('Error declining request:', error);
      }
    };

    const handleAccept = async (selectedRequest) => {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        console.error('No user or selected request found.');
        return;
      }  
      
      try {
        const matchingRequestDocRef = doc(
          firestore,
          'professionals',
          currentUser.uid,
          'matchingRequests',
          selectedRequest.id
        );
  
        const acceptRequestDocRef = doc(
          firestore,
          'professionals',
          currentUser.uid,
          'acceptedRequests',
          selectedRequest.id
        );
  
        const requestHistoryRef = collection(
          firestore,
          'professionals',
          currentUser.uid,
          'requestHistory'
        );
  
        const requestDocRef = doc(requestHistoryRef, selectedRequest.id);
        await setDoc(requestDocRef, {
          ...selectedRequest,
          status: 'accepted',
          acceptedAt: serverTimestamp(),
        });
  
        await setDoc(acceptRequestDocRef, {
          ...selectedRequest,
          status: 'accepted',
          acceptedAt: serverTimestamp(),
        });
  
        const notificationRef = doc(
          collection(firestore, `notifications/${selectedRequest.userId}/messages`)
        );
        await setDoc(notificationRef, {
          recipientId: selectedRequest.userId,
          message: `Your matching request has been accepted.`,
          type: 'matching',
          createdAt: serverTimestamp(),
          isRead: false,
        });
  
        await deleteDoc(matchingRequestDocRef);
        console.log('Request accepted and added successfully!');
        
        fetchRequests();
      } catch (error) {
        console.error('Error accepting request:', error);
      }
    };
  
    const renderItem = ({ item }) => {
      const requestedAt = item.requestedAt?.toDate();
      const formattedTime = requestedAt
        ? requestedAt.toLocaleTimeString('en-US', { timeZone: 'Asia/Singapore', hour12: true })
        : 'Time not available';
      const formattedDate = requestedAt
        ? requestedAt.toLocaleDateString('en-US', { timeZone: 'Asia/Singapore' })
        : 'Date not available';
  
      return (
        <View style={styles.requestItem}>
          <TouchableOpacity onPress={() => handleRequestPress(item)}>
            <Text style={styles.name}>{item.requesterName || 'Unknown User'}</Text>
            <Text style={styles.time}>{formattedTime}</Text>
            <Text style={styles.date}>{formattedDate}</Text>
          </TouchableOpacity>
          <View style={styles.icons}>
            <TouchableOpacity onPress={() => handleAccept(item)}>
              <MaterialIcons name="check-circle" size={24} color="green" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => openDeclineModal(item)}>
              <MaterialIcons name="cancel" size={24} color="red" />
            </TouchableOpacity>
          </View>
        </View>
      );
    };
   

    return (
      <RootLayout screenName="ViewRequest" navigation={navigation} userType={userType}>
        <View style={styles.container}>
          <Text style={styles.title}>View Requests</Text>
  
          {loading ? (
            <ActivityIndicator size="large" color={Colors.purple} />
          ) : (
            <FlatList
              data={requests}
              keyExtractor={(item) => item.id}
              renderItem={renderItem}
              contentContainerStyle={{ paddingBottom: 20 }}
              ListEmptyComponent={<Text style={styles.emptyText}>No requests found.</Text>}
            />
          )}
  
          {/* Decline Modal */}
          <Modal
            animationType="slide"
            transparent
            visible={modalVisible}
            onRequestClose={() => setModalVisible(false)}
          >
            <View style={styles.modalContainer}>
              <View style={styles.modalView}>
                <Text style={styles.modalTitle}>Reason for decline?</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Reason..."
                  value={reason}
                  onChangeText={(text) => setReason(text)}
                />
                <TouchableOpacity style={styles.submitButton} onPress={handleDecline}>
                  <Text style={styles.submitText}>Submit</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
  
           {/* Details Modal */}
           <Modal
  animationType="slide"
  transparent
  visible={detailsModalVisible}
  onRequestClose={() => setDetailsModalVisible(false)}
>
  <View style={styles.detailsModalOverlay}>
    <View style={styles.detailsModalContent}>
      {selectedRequestDetails ? (
        <>
          <Image
            source={{ uri: selectedRequestDetails.profileImage || 'https://via.placeholder.com/150' }}
            style={styles.profilePicture}
          />
          <Text style={styles.detailsModalDetail}><Text style={styles.boldText}>Name:</Text> {selectedRequestDetails.fullName || 'N/A'}</Text>
          <Text style={styles.detailsModalDetail}><Text style={styles.boldText}>Age:</Text> {selectedRequestDetails.age || 'N/A'}</Text>
          <Text style={styles.detailsModalDetail}><Text style={styles.boldText}>Gender:</Text> {selectedRequestDetails.gender || 'N/A'}</Text>
          <Text style={styles.detailsModalDetail}><Text style={styles.boldText}>Contact:</Text> {selectedRequestDetails.mobileNumber || 'N/A'}</Text>
          <Text style={styles.detailsModalDetail}><Text style={styles.boldText}>Email:</Text> {selectedRequestDetails.email || 'N/A'}</Text>
          {selectedRequestDetails.selfAssessment ? (
            <>
              <Text style={styles.detailsModalTitle}>Latest Self-Assessment</Text>
              <Text style={styles.detailsModalDetail}><Text style={styles.boldText}>GAD-7: </Text> 
              {selectedRequestDetails.selfAssessment.gad7Total} - {selectedRequestDetails.selfAssessment.gad7Interpretation || 'N/A'}</Text>
              <Text style={styles.detailsModalDetail}><Text style={styles.boldText}>PHQ-9: </Text> 
              {selectedRequestDetails.selfAssessment.phq9Total} - {selectedRequestDetails.selfAssessment.phq9Interpretation || 'N/A'}</Text>
              <Text style={styles.detailsModalDetail}><Text style={styles.boldText}>PSS: </Text> 
              {selectedRequestDetails.selfAssessment.pssTotal} - {selectedRequestDetails.selfAssessment.pssInterpretation || 'N/A'}</Text>
            </>
          ) : (
            <Text style={styles.noDataText}>No self-assessment data available.</Text>
          )}
        </>
      ) : (
        <Text style={styles.noDataText}>Unable to load details.</Text>
      )}
      <TouchableOpacity style={styles.detailsCloseButton} onPress={() => setDetailsModalVisible(false)}>
        <Text style={styles.detailsCloseButtonText}>Close</Text>
      </TouchableOpacity>
    </View>
  </View>
</Modal>

          </View>
      </RootLayout>
    );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'flex-start',
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'left',
  },
  requestList: {
    flex: 1,
  },
  requestItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  requestInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  name: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 5,
  },
  time: {
    fontSize: 12,
    color: 'gray',
  },
  date: {
    fontSize: 12,
    color: 'gray',
  },
  icons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalView: {
    width: 300,
    padding: 20,
    backgroundColor: 'white',
    borderRadius: 10,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  input: {
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    marginBottom: 20,
    paddingHorizontal: 10,
    width: '100%',
    borderRadius: 8,
  },
  submitButton: {
    backgroundColor: '#6A0DAD',
    paddingVertical: 10,
    paddingHorizontal: 40,
    borderRadius: 8,
  },
  submitText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptyText: {
    fontSize: 16,
    color: 'gray',
    textAlign: 'center',
    marginTop: 20,
  },
  profilePicture: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 20,
  },
  detailsModalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  
  detailsModalContent: {
    width: '85%',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
    elevation: 5, 
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  
  detailsModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
    textAlign: 'center',
  },
  
  detailsModalDetail: {
    fontSize: 16,
    color: '#555',
    marginBottom: 10,
    textAlign: 'center',
    alignSelf: 'stretch',
  },
  
  boldText: {
    fontWeight: 'bold',
    color: '#000',
  },
  
  detailsCloseButton: {
    marginTop: 20,
    backgroundColor: '#6A0DAD',
    paddingVertical: 10,
    paddingHorizontal: 30,
    borderRadius: 8,
    alignItems: 'center',
  },
  
  detailsCloseButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  
  noDataText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  
});
