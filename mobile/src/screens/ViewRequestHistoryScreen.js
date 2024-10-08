import React, { useContext } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons'; // For icons
import { RootLayout } from '../navigation/RootLayout'; // Keeping RootLayout as per your structure
import { AuthenticatedUserContext } from '../../shared/providers';

export const ViewRequestHistoryScreen = ({ navigation }) => {
  const { userType } = useContext(AuthenticatedUserContext);
  // Sample data for historical requests
  const requestHistory = [
    { id: '1', name: 'John Smith', date: '25 June 2024', status: 'approved' },
    { id: '2', name: 'Alex Johnson', date: '19 May 2024', status: 'rejected' },
    { id: '3', name: 'Skyler Jones', date: '5 March 2024', status: 'approved' },
  ];

  return (
    <RootLayout screenName={'ViewRequestHistory'} navigation={navigation} userType={userType}>
      <View style={styles.container}>
        {/* Main title */}
        <Text style={styles.title}>View Request History</Text>

        {/* Historical Requests List */}
        <View style={styles.requestList}>
          {requestHistory.map((item) => (
            <View key={item.id} style={styles.requestItem}>
              {/* Name and Date Info */}
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.date}>{item.date}</Text>

              {/* Status Icon */}
              <MaterialIcons
                name={item.status === 'approved' ? 'check-circle' : 'cancel'}
                size={24}
                color={item.status === 'approved' ? 'green' : 'red'}
              />
            </View>
          ))}
        </View>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
  },
  date: {
    fontSize: 14,
    color: '#666',
  },
});
