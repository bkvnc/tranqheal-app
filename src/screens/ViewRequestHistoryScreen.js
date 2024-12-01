import React, { useEffect, useState, useContext } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { RootLayout } from '../navigation/RootLayout';
import { AuthenticatedUserContext } from '../providers';
import { auth, firestore } from '../config';
import { collection, query, getDocs } from 'firebase/firestore';

export const ViewRequestHistoryScreen = ({ navigation }) => {
  const { user } = useContext(AuthenticatedUserContext);
  const [requestHistory, setRequestHistory] = useState([]);
  const [loading, setLoading] = useState(true);

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

        const requests = querySnapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            acceptedAt: data.acceptedAt?.toDate ? data.acceptedAt.toDate() : data.acceptedAt,
            declinedAt: data.declinedAt?.toDate ? data.declinedAt.toDate() : data.declinedAt,
          };
        });

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

  return (
    <RootLayout screenName={'ViewRequestHistory'} navigation={navigation} userType={user?.type}>
      <View style={styles.container}>
        <Text style={styles.title}>View Request History</Text>

        {loading ? (
          <ActivityIndicator size="large" color="#0000ff" />
        ) : requestHistory.length === 0 ? (
          <Text style={styles.noDataText}>No request history found.</Text>
        ) : (
          <View style={styles.requestList}>
            {requestHistory.map((item) => (
              <View key={item.id} style={styles.requestItem}>
                <Text style={styles.name}>{item.requesterName || 'Unknown User'}</Text>
                <Text style={styles.status}>
                  Status: {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                </Text>
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
              </View>
            ))}
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
});
