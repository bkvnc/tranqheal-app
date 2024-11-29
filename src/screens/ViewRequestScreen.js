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
      // Reference to the matching request to delete
      const matchingRequestDocRef = doc(
        firestore,
        'professionals',
        currentUser.uid,
        'matchingRequests',
        selectedRequest.id
      );

      // Optionally send a notification to the requester
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

      // Delete the matching request
      await deleteDoc(matchingRequestDocRef);
      console.log('Request declined and removed successfully!');

      // Clear the modal and refresh the requests
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
      const acceptedRequestsRef = collection(
        firestore,
        'professionals',
        currentUser.uid,
        'acceptedRequests'
      );
      const requestDocRef = doc(acceptedRequestsRef, selectedRequest.id);

      const acceptedData = {
        requesterId: selectedRequest.userId,
        requesterName: selectedRequest.requesterName || 'Unknown User',
        status: 'accepted',
        acceptedAt: serverTimestamp(),
      };
      await setDoc(requestDocRef, acceptedData);

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

  const renderItem = ({ item }) => (
    <View style={styles.requestItem}>
      <View>
        <Text style={styles.name}>{item.requesterName || 'Unknown User'}</Text>
        <Text style={styles.time}>
          {item.createdAt?.toDate
            ? item.createdAt.toDate().toLocaleTimeString()
            : 'Time not available'}
        </Text>
        <Text style={styles.date}>
          {item.createdAt?.toDate
            ? item.createdAt.toDate().toLocaleDateString()
            : 'Date not available'}
        </Text>
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
    fontSize: 14,
    fontWeight: '600',
    marginRight: 10,
  },
  time: {
    fontSize: 12,
    color: '#666',
    marginRight: 10,
  },
  date: {
    fontSize: 12,
    color: '#666',
  },
  icons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: 60, // Adjust based on icon spacing
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)', // Translucent background
  },
  modalView: {
    width: '90%',
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  input: {
    width: '100%',
    height: 100,
    backgroundColor: '#F5F5F5',
    borderRadius: 10,
    padding: 10,
    textAlignVertical: 'top', // To start the text at the top
    marginBottom: 20,
  },
  submitButton: {
    backgroundColor: Colors.purple,
    paddingVertical: 10,
    paddingHorizontal: 40,
    borderRadius: 20,
  },
  submitText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});
