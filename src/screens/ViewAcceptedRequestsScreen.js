import React, { useEffect, useState, useContext } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { RootLayout } from '../navigation/RootLayout';
import { AuthenticatedUserContext } from '../providers';
import { firestore } from '../config';
import { collection, query, getDocs } from 'firebase/firestore';

export const ViewAcceptedRequestsScreen = ({ navigation }) => {
  const { user, userType } = useContext(AuthenticatedUserContext);
  const [acceptedRequests, setAcceptedRequests] = useState([]);
  const [loading, setLoading] = useState(true);

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
        setLoading(false);
      }
    };

    fetchAcceptedRequests();
  }, [user]);

  const renderItem = ({ item }) => {
    const acceptedAt = item.acceptedAt;
    const formattedTime = acceptedAt
      ? acceptedAt.toLocaleTimeString('en-US', { timeZone: 'Asia/Singapore', hour12: true })
      : 'Time not available';
    const formattedDate = acceptedAt
      ? acceptedAt.toLocaleDateString('en-US', { timeZone: 'Asia/Singapore' })
      : 'Date not available';

    return (
      <View key={item.id} style={styles.requestItem}> 
        <Text style={styles.name}>{item.requesterName || 'Unknown User'}</Text>
        <Text style={styles.status}>Status: Accepted</Text>
        <Text style={styles.date}>Accepted At: {formattedDate} at {formattedTime}</Text>
        <MaterialIcons name="check-circle" size={24} color="green" />
      </View>
    );
  };

  return (
    <RootLayout screenName={'ViewAcceptedRequests'} navigation={navigation} userType={userType}>
      <View style={styles.container}>
        <Text style={styles.title}>View Accepted Requests</Text>

        {loading ? (
          <ActivityIndicator size="large" color="#0000ff" />
        ) : acceptedRequests.length === 0 ? (
          <Text style={styles.noDataText}>No accepted requests found.</Text>
        ) : (
          <View style={styles.requestList}>
            {acceptedRequests.map((item) => renderItem({ item }))}
          </View>
        )}
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
});
