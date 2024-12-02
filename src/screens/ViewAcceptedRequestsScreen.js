import React, { useEffect, useState, useContext } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, Modal, Image, Button } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { RootLayout } from '../navigation/RootLayout';
import { AuthenticatedUserContext } from '../providers';
import { firestore } from '../config';
import { collection, query, getDocs, doc, getDoc } from 'firebase/firestore';
import { LoadingIndicator } from 'src/components';

export const ViewAcceptedRequestsScreen = ({ navigation }) => {
  const { user, userType } = useContext(AuthenticatedUserContext);
  const [acceptedRequests, setAcceptedRequests] = useState([]);
  const [isloading, setIsLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedRequestDetails, setSelectedRequestDetails] = useState(null);

  useEffect(() => {
    const fetchAcceptedRequests = async () => {
      if (!user?.uid) {
        setLoading(false);
        return;
      }

      try {
        const acceptedRequestsRef = collection(firestore, 'professionals', user.uid, 'acceptedRequests');
        const acceptedRequestsQuery = query(acceptedRequestsRef);
        const querySnapshot = await getDocs(acceptedRequestsQuery);

        const requests = querySnapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id, 
            ...data,
            acceptedAt: data.acceptedAt?.toDate ? data.acceptedAt.toDate() : data.acceptedAt,
          };
        });

        setAcceptedRequests(requests);
      } catch (error) {
        console.error('Error fetching accepted requests:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAcceptedRequests();
  }, [user]);

  const fetchRequesterDetails = async (requesterId) => {
    if (!requesterId) return null;

    try {
      const userDocRef = doc(firestore, 'users', requesterId);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        const data = userDoc.data();
        const fullName = [
          data.firstName,
          data.middleName,
          data.lastName
        ]
        .filter(Boolean)
        .join(' ');

        return { id: userDoc.id, fullName, ...userDoc.data() };
      } else {
        console.warn('No such user found for ID:', requesterId);
        return null;
      }
    } catch (error) {
      console.error('Error fetching user details:', error);
      return null;
    }
  };

  const handleRequestPress = async (item) => {
    setIsLoading(true);
    const details = await fetchRequesterDetails(item.requesterId);
    setSelectedRequestDetails(details);
    setModalVisible(true);
    setIsLoading(false);
  };

  const renderItem = ({ item }) => {
    const acceptedAt = item.acceptedAt;
    const formattedTime = acceptedAt
      ? acceptedAt.toLocaleTimeString('en-US', { timeZone: 'Asia/Singapore', hour12: true })
      : 'Time not available';
    const formattedDate = acceptedAt
      ? acceptedAt.toLocaleDateString('en-US', { timeZone: 'Asia/Singapore' })
      : 'Date not available';

    return (
      <TouchableOpacity onPress={() => handleRequestPress(item)} key={item.id} style={styles.requestItem}>
        <Text style={styles.name}>{item.requesterName || 'Unknown User'}</Text>
        <Text style={styles.status}>Status: Accepted</Text>
        <Text style={styles.date}>Accepted At: {formattedDate} at {formattedTime}</Text>
        <MaterialIcons name="check-circle" size={24} color="green" />
      </TouchableOpacity>
    );
  };

  if(isloading) return <LoadingIndicator />

  return (
    <RootLayout screenName={'ViewAcceptedRequests'} navigation={navigation} userType={userType}>
      <View style={styles.container}>
        <Text style={styles.title}>View Accepted Requests</Text>

        {isloading ? (
          <ActivityIndicator size="large" color="#0000ff" />
        ) : acceptedRequests.length === 0 ? (
          <Text style={styles.noDataText}>No accepted requests found.</Text>
        ) : (
          <View style={styles.requestList}>
            {acceptedRequests.map((item) => renderItem({ item }))}
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
                  <Text style={styles.modalName}>Name: {selectedRequestDetails.fullName || 'N/A'}</Text>
                  <Text style={styles.modalDetail}>Age: {selectedRequestDetails.age || 'N/A'}</Text>
                  <Text style={styles.modalDetail}>Gender: {selectedRequestDetails.gender || 'N/A'}</Text>
                  <Text style={styles.modalDetail}>Contact Number: {selectedRequestDetails.mobileNumber || 'N/A'}</Text>
                  <Text style={styles.modalDetail}>Email: {selectedRequestDetails.email || 'N/A'}</Text>
                </>
              ) : (
                <Text style={styles.noDataText}>Unable to load details.</Text>
              )}
              <Button title="Close" onPress={() => setModalVisible(false)} />
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
  profilePicture: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 20,
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
