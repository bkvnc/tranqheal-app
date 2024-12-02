import React, { useContext, useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, Alert, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { RootLayout } from '../navigation/RootLayout';
import { Colors, auth, firestore } from '../config';
import { AuthenticatedUserContext } from '../providers';
import { LoadingIndicator } from 'src/components';
import { collection, getDocs, query, orderBy, writeBatch, doc } from 'firebase/firestore';

export const MoodLogsScreen = ({ navigation }) => {
  const { userType } = useContext(AuthenticatedUserContext);
  const [ isloading, setIsLoading ] = useState(true);
  const [ moodLogs, setMoodLogs ] = useState([]);
  const [ modalVisible, setModalVisible ] = useState(false);
  const [ selectedLog, setSelectedLog ] = useState(null);

  const fetchMoodLogs = async () => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    const userId = currentUser.uid;
    const moodTrackingRef = collection(firestore, `users/${userId}/moodTrackings`);
    const moodTrackingQuery = query(moodTrackingRef, orderBy('createdAt', 'desc'));

    try {
      const querySnapshot = await getDocs(moodTrackingQuery);
      const logs = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setMoodLogs(logs);
    } catch (error) {
      console.error('Error fetching mood tracking logs:', error);
      Alert.alert('Error', 'There was an error fetching your mood tracking logs.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMoodLogs();
  }, []);

  const openModal = (log) => {
    setSelectedLog(log);
    setModalVisible(true);
  }

  const closeModal = () => {
    setSelectedLog(null);
    setModalVisible(false);
  }

  const clearLogs = () => {
    Alert.alert(
      'Clear All Logs',
      'Are you sure you want to clear all logs?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          onPress: async () => {
            try {
              const currentUser = auth.currentUser;
              if (!currentUser) return;

              const batch = writeBatch(firestore);
              moodLogs.forEach((moodLog) => {
                const moodTrackingRef = doc(
                  firestore,
                  `users/${currentUser.uid}/moodTrackings`,
                  moodLog.id
                );
                batch.delete(moodTrackingRef);
              });
              await batch.commit();
              setMoodLogs([]);
              Alert.alert('Success', 'All logs have been cleared.');              
            } catch (error) {
              console.error("Error clearing logs:", error);
            }
          },
        },
      ]
    );
  }

  if (isloading) {
    return <LoadingIndicator />;
  }

  return (
    <RootLayout screenName={'Mood'} navigation={navigation} userType={userType}>
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.textContainer}>
            <Text style={styles.ProfileTitle}>Logs</Text>
          </View>
          <TouchableOpacity onPress={clearLogs} style={styles.clearButton}>
            <Ionicons name="trash-outline" size={24} color="black" />
            <Text style={styles.clearButtonText}>Clear All</Text>
          </TouchableOpacity>
        </View>
        {moodLogs.length > 0 ? (
          <FlatList
            data={moodLogs}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity onPress={() => openModal(item)}>
                  <View style={styles.logContainer}>
                    <Text style={styles.logDate}>
                      {new Date(item.createdAt.toDate()).toLocaleDateString()}
                    </Text>
                    <Text style={styles.logLabel}>{item.mood}</Text>
                  </View>
              </TouchableOpacity>
            )}
          />
        ) : (
          <Text style={styles.noLogsText}>No mood tracking logs found.</Text>
        )}

        {selectedLog && (
          <Modal
            visible={modalVisible}
            transparent={true}
            animationType="slide"
            onRequestClose={closeModal}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalContainer}>
                <Text style={styles.modalTitle}>Mood Suggestion</Text>
                <Text style={styles.modalText}>
                  Date: {new Date(selectedLog.createdAt.toDate()).toLocaleString('en-US', {hour12: true})}
                </Text>
                <Text style={styles.modalText}>
                  Suggestion: {selectedLog.suggestion}
                </Text>
                <TouchableOpacity onPress={closeModal} style={styles.closeButton}>
                  <Text style={styles.closeButtonText}>Close</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        )}
      </View>
    </RootLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: Colors.white,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  textContainer: {
    flex: 1,
    marginRight: 10,
    marginBottom: 10,
  },
  ProfileTitle: {
    fontSize: 34,
    fontWeight: 'bold',
  },
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 5,
  },
  clearButtonText: {
    fontSize: 16,
    marginLeft: 5,
    color: 'black',
  },
  button: {
    backgroundColor: Colors.purple, 
    paddingVertical: 15,
    paddingHorizontal: 100,
    borderRadius: 30,
  },
  buttonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  logContainer: {
    padding: 15,
    backgroundColor: '#f9f9f9',
    borderRadius: 10,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
  },
  logDate: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.grey,
  },
  logLabel: {
    fontSize: 18,
    color: Colors.purple, 
    marginRight: 5,
  },
  noLogsText: {
    fontSize: 16,
    color: Colors.grey,
    textAlign: 'center',
    marginTop: 20,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContainer: {
    width: '80%',
    padding: 20,
    backgroundColor: 'white',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: Colors.purple,
  },
  modalText: {
    fontSize: 16,
    marginBottom: 10,
    color: Colors.grey,
  },
  closeButton: {
    marginTop: 20,
    paddingVertical: 10,
    backgroundColor: Colors.purple,
    borderRadius: 5,
    alignItems: 'center',
  },
  closeButtonText: {
    color: 'white',
    fontSize: 16,
  },
});