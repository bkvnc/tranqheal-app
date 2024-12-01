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
  deleteDoc,
  setDoc,
  addDoc,
  serverTimestamp,
} from 'firebase/firestore';

export const ViewRequestScreen = ({ navigation }) => {
  const { userType } = useContext(AuthenticatedUserContext);
  const [modalVisible, setModalVisible] = useState(false);
  const [reason, setReason] = useState('');
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState(null);

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

  const openDeclineModal = (request) => {
    setSelectedRequest(request);
    setModalVisible(true);
  };

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

      // Declined requests are stored in the 'declinedRequests' collection
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
      await addDoc(requestDocRef, {
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

      // Accepted requests are stored in the 'acceptedRequests' collection
      const acceptedRequestsRef = doc(
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

      const acceptedData = {
        requesterId: selectedRequest.userId,
        requesterName: selectedRequest.requesterName || 'Unknown User',
        status: 'accepted',
        acceptedAt: serverTimestamp(),
      };

      await setDoc(acceptedRequestsRef, acceptedData);
      await addDoc(requestHistoryRef, {
        ...acceptedData,
      });

      const notificationRef = doc(
        collection(firestore, `notifications/${selectedRequest.userId}/messages`)
      );
      await setDoc(notificationRef, {
        recipientId: selectedRequest.userId,
        message: `You've been matched! A professional has accepted your request.`,
        type: 'matching',
        createdAt: serverTimestamp(),
        isRead: false,
      });

      await deleteDoc(matchingRequestDocRef);
      console.log('Request accepted successfully, and matching request removed!');
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
        <View>
          <Text style={styles.name}>{item.requesterName || 'Unknown User'}</Text>
          <Text style={styles.time}>{formattedTime}</Text>
          <Text style={styles.date}>{formattedDate}</Text>
        </View>
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
    backgroundColor: '#FF0000',
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
});
