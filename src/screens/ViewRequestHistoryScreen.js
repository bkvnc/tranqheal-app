import React, { useEffect, useState, useContext } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Modal, Image, Button, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { RootLayout } from '../navigation/RootLayout';
import { AuthenticatedUserContext } from '../providers';
import { auth, firestore } from '../config';
import { collection, query, getDocs, getDoc, doc } from 'firebase/firestore';

export const ViewRequestHistoryScreen = ({ navigation }) => {
  const { userType, user } = useContext(AuthenticatedUserContext);
  const [requestHistory, setRequestHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedRequestDetails, setSelectedRequestDetails] = useState(null);



  useEffect(() => {
    const fetchRequestHistory = async () => {
      if (!user?.uid) {
        setLoading(false);
        return;
      }
    
      try {
        const requestHistoryRef = collection(firestore, 'professionals', user.uid, 'requestHistory');
        const requestHistoryQuery = query(requestHistoryRef);
        const querySnapshot = await getDocs(requestHistoryQuery);
    
        const requests = await Promise.all(
          querySnapshot.docs.map(async (document) => {
            const data = document.data();
            let profileImage = null;
        
            // Fetch requester details for profile image
            if (data.requesterId) {
              const userDocRef = doc(firestore, 'users', data.requesterId);
              const userDoc = await getDoc(userDocRef);
              if (userDoc.exists()) {
                profileImage = userDoc.data().profileImage || null;
              }
            }
        
            return {
              id: document.id,
              ...data,
              profileImage, // Add profileImage to the request
              acceptedAt: data.acceptedAt?.toDate ? data.acceptedAt.toDate() : data.acceptedAt,
              declinedAt: data.declinedAt?.toDate ? data.declinedAt.toDate() : data.declinedAt,
            };
          })
        );    
    
        setRequestHistory(requests);
      } catch (error) {
        console.error('Error fetching request history:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchRequestHistory();
  }, [user]);

  
  const formatDate = (date) => {
    if (!date) return 'N/A';
    const formattedTime = date.toLocaleTimeString('en-US', { timeZone: 'Asia/Singapore', hour12: true });
    const formattedDate = date.toLocaleDateString('en-US', { timeZone: 'Asia/Singapore' });
    return `${formattedDate} at ${formattedTime}`;
  };

  const handleRequestPress = (item) => {
    setSelectedRequestDetails(item);
    setModalVisible(true);
  };
  
  return (
    <RootLayout screenName={'ViewRequestHistory'} navigation={navigation} userType={userType}>
      <View style={styles.container}>
        <Text style={styles.title}>View Request History</Text>

        {loading ? (
          <ActivityIndicator size="large" color="#0000ff" />
        ) : requestHistory.length === 0 ? (
          <Text style={styles.noDataText}>No request history found.</Text>
        ) : (
          <View style={styles.requestList}>
            {requestHistory.map((item) => (
              <TouchableOpacity key={item.id} onPress={() => handleRequestPress(item)} style={styles.requestItem}>
                <Text style={styles.name}>{item.requesterName || 'Unknown User'}</Text>
                <Text style={styles.status}>Status: {item.status.charAt(0).toUpperCase() + item.status.slice(1)}</Text>
                {item.status === 'declined' && item.declinedReason && (
                  <Text style={styles.reason}>Reason: {item.declinedReason}</Text>
                )}
                <Text style={styles.date}>
                  {item.status === 'accepted'
                    ? `Accepted At: ${formatDate(item.acceptedAt)}`
                    : `Declined At: ${formatDate(item.declinedAt)}`}
                </Text>
                <MaterialIcons
                  name={item.status === 'accepted' ? 'check-circle' : 'cancel'}
                  size={24}
                  color={item.status === 'accepted' ? 'green' : 'red'}
                />
              </TouchableOpacity>
            ))}
          </View>
        )}
        <Modal
          animationType="slide"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              {selectedRequestDetails ? (
                <>
                  <Image
                      source={{ uri: selectedRequestDetails.profileImage || 'https://via.placeholder.com/150' }}
                      style={styles.profilePicture}
                    />
                  <Text style={styles.modalName}>Name: {selectedRequestDetails.requesterName || 'Unknown User'}</Text>
                  <Text style={styles.modalDetail}>Status: {selectedRequestDetails.status || 'N/A'}</Text>
                  {selectedRequestDetails.status === 'declined' && (
                    <Text style={styles.modalDetail}>Reason: {selectedRequestDetails.declinedReason || 'N/A'}</Text>
                  )}
                  <Text style={styles.modalDetail}>
                    {selectedRequestDetails.status === 'accepted'
                      ? `Accepted At: ${formatDate(selectedRequestDetails.acceptedAt)}`
                      : `Declined At: ${formatDate(selectedRequestDetails.declinedAt)}`}
                  </Text>
                </>
              ) : (
                <Text style={styles.noDataText}>No details available.</Text>
              )}
              <Button title="Close" color="#6A0DAD" onPress={() => setModalVisible(false)} />
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
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  requestList: {
    flex: 1,
  },
  requestItem: {
    marginBottom: 15,
    padding: 15,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 8,
    backgroundColor: '#F9F9F9',
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 5,
  },
  status: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 5,
  },
  reason: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  date: {
    fontSize: 12,
    color: '#666',
    marginBottom: 5,
  },
  noDataText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#666',
  },
  profilePicture: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '80%',
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 10,
    alignItems: 'center',
  },
  modalName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  modalDetail: {
    fontSize: 16,
    marginBottom: 10,
  },  
});
