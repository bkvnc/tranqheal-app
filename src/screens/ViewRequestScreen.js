import React, { useState, useContext, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, TextInput } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons'; // For icons
import { RootLayout } from '../navigation/RootLayout';
import { Colors } from '../config';
import { AuthenticatedUserContext } from '../providers';
import { firestore } from '../config';

export const ViewRequestScreen = ({ navigation }) => {
  const { userType } = useContext(AuthenticatedUserContext);
  const [modalVisible, setModalVisible] = useState(false);
  const [reason, setReason] = useState(''); // To store the decline reason


  useEffect(() => {
    if (!userType || !userType.uid) return;

    const fetchRequests = async () => {
      try {
        const querySnapshot = await firestore
          .collection('matchingRequests')
          .where('professionalId', '==', user.uid)
          .get();

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

    fetchRequests();
  }, [userType]);

  const renderItem = ({ item }) => (
    <View style={styles.requestItem}>
      <View style={styles.requestInfo}>
        <Text style={styles.name}>{item.requesterName}</Text>
        <Text style={styles.time}>{item.createdAt}</Text>
        <Text style={styles.date}>{item.createdAt}</Text>
      </View>
      <View style={styles.icons}>
        <MaterialIcons name="check-circle" size={24} color="green" />
        <TouchableOpacity onPress={openDeclineModal}>
          <MaterialIcons name="cancel" size={24} color="red" />
        </TouchableOpacity>
      </View>
    </View>
  );


  // Function to open modal
  const openDeclineModal = () => {
    setModalVisible(true);
  };

  // Function to handle submit
  const handleSubmit = () => {
    // You can handle the decline action here 
    console.log('Decline reason:', reason);
    setModalVisible(false);
  };

  return (
    <RootLayout screenName={'ViewRequest'} navigation={navigation} userType={user.userType}>
      <View style={styles.container}>
        <Text style={styles.title}>View Requests</Text>

        {loading ? (
          <ActivityIndicator size="large" color={Colors.purple} />
        ) : (
          <FlatList
            data={requests}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            ListEmptyComponent={<Text style={styles.emptyText}>No requests found.</Text>}
          />
        )}

        {/* Decline Modal */}
        <Modal
          animationType="slide"
          transparent={true}
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
              <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
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
