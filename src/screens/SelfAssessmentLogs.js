import React, { useContext, useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, Alert, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { RootLayout } from '../navigation/RootLayout';
import { Colors, firestore, auth } from '../config';
import { AuthenticatedUserContext } from '../providers';
import { collection, getDocs, query, where, orderBy, writeBatch, doc } from 'firebase/firestore';
import { LoadingIndicator } from '../components';

export const SelfAssessmentLogs = ({ navigation }) => {
  const { userType } = useContext(AuthenticatedUserContext);
  const [selfAssessments, setSelfAssessments] = useState([]);
  const [isloading, setIsLoading] = useState(true);
  const [ modalVisible, setModalVisible ] = useState(false);
  const [ selectedLog, setSelectedLog ] = useState(null);

  const fetchSelfAssessmentLogs = async () => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    const userId = currentUser.uid;
    const selfAssessmentRef = collection(firestore, `users/${userId}/selfAssessment`);
    const selfAssessmentQuery = query(selfAssessmentRef, orderBy('createdAt', 'desc'));

    try {
      const querySnapshot = await getDocs(selfAssessmentQuery);
      const logs = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setSelfAssessments(logs);
    } catch (error) {
      console.error('Error fetching self-assessment logs:', error);
      Alert.alert('Error', 'There was an error fetching your self-assessment logs.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSelfAssessmentLogs();
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
              selfAssessments.forEach((selfAssessment) => {
                const selfAssessmentRef = doc(
                  firestore,
                  `users/${currentUser.uid}/selfAssessment`,
                  selfAssessment.id
                );
                batch.delete(selfAssessmentRef);
              });
              await batch.commit();
              setSelfAssessments([]);
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
    <RootLayout screenName={'SelfAssessmentLogs'} navigation={navigation} userType={userType}>
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
        {selfAssessments.length > 0 ? (
          <FlatList
            data={selfAssessments}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity onPress={() => openModal(item)}>
                  <View style={styles.logContainer}>
                    <Text style={styles.logDate}>
                      {new Date(item.createdAt.toDate()).toLocaleDateString()}
                    </Text>
                    <View style={styles.scoreRow}>
                    <Text style={styles.logLabel}>PHQ-9:</Text>
                    <Text style={styles.logValue}>{item.phq9Total || '0'}</Text>
                    <Text style={styles.logLabel}>GAD-7:</Text>
                    <Text style={styles.logValue}>{item.gad7Total || '0'}</Text>
                    <Text style={styles.logLabel}>PSS:</Text>
                    <Text style={styles.logValue}>{item.pssTotal || '0'}</Text>
                    </View>
                  </View>
              </TouchableOpacity>
            )}
          />
        ) : (
          <Text style={styles.noLogsText}>No self-assessment logs found.</Text>
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
                <Text style={styles.modalTitle}>Assessment Interpretation</Text>
                <Text style={styles.modalText}>
                  Date: {new Date(selectedLog.createdAt.toDate()).toLocaleString('en-US', {hour12: true})}
                </Text>
                <Text style={styles.modalText}>
                  PHQ-9 Score: {selectedLog.phq9Total || '0'}
                </Text>
                <Text style={styles.modalText}>
                  Interpretation: {selectedLog.phq9Interpretation || 'N/A'}
                </Text>
                <Text style={styles.modalText}>
                  GAD-7 Score: {selectedLog.gad7Total || '0'}
                </Text>
                <Text style={styles.modalText}>
                  Interpretation: {selectedLog.gad7Interpretation || 'N/A'}
                </Text>
                <Text style={styles.modalText}>
                  PSS Score: {selectedLog.pssTotal || '0'}
                </Text>
                <Text style={styles.modalText}>
                  Interpretation: {selectedLog.pssInterpretation || 'N/A'}
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
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: 'white',
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
    color: Colors.purple,
  },
  logLabel: {
    fontSize: 16,
    color: Colors.grey, 
    marginRight: 5,
  },
  logValue: {
    fontSize: 14,
    color: Colors.yellow, 
    marginRight: 15,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
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
