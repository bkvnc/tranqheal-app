import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Linking, Alert } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { RootLayout } from '../navigation/RootLayout'; 
import { firestore, storage, auth } from '../config';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { collection, addDoc, setDoc, doc, getDoc } from 'firebase/firestore';

export const UploadCredentialsScreen = ({ navigation, route }) => {
  const { isRegistered, organizationId, organizationName, userType, userStatus } = route.params;
  const [file, setFile] = useState(null); 
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [fetchedFirstName, setFetchedFirstName] = useState('');
  const [fetchedLastName, setFetchedLastName] = useState('');

  // Function to pick a document
  const pickDocument = async () => {
    try {
      let result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf', // Adjust the file type as needed
      });
  
      console.log('Document Picker Result:', result);

      // Check if the user canceled the document picker
      if (result.canceled) {
        Alert.alert('Error', 'Document selection was canceled.');
        return;
      }
      
      // Check if we have a valid asset
      if (result.assets && result.assets.length > 0) {
        // Access the document properties
        const documentUri = result.assets[0].uri;
        const documentName = result.assets[0].name;
        const documentSize = result.assets[0].size;

        // Use the document URI for uploading or other purposes
        console.log('Document URI:', documentUri);
        console.log('Document Name:', documentName);
        console.log('Document Size:', documentSize);

        setFile({ name: documentName, uri: documentUri, size: documentSize }); // Store the result in the state or handle as needed
      } else {
        Alert.alert('Error', 'Could not retrieve file. Please try a different file.');
      }
    } catch (error) {
      console.error('Error picking document:', error);
      Alert.alert('Error', 'An unexpected error occurred while picking the document.');
    }
  };

  // Fetch professional data if registered
  useEffect(() => {
    const fetchProfessionalData = async () => {
      if (isRegistered) {
        const user = auth.currentUser;
        if (user) {
          const profDocRef = doc(firestore, 'professionals', user.uid);
          const profDoc = await getDoc(profDocRef);
          if (profDoc.exists()) {
            const profData = profDoc.data();
            setFetchedFirstName(profData.firstName);
            setFetchedLastName(profData.lastName);
          }
        }
      }
    };
    fetchProfessionalData();
  }, [isRegistered]);

  // Function to submit the form
  const handleSubmit = async () => {
    const user = auth.currentUser;
    if (!user) {
      Alert.alert('User not authenticated');
      return;
    }
    if(!file) {
      Alert.alert('No File Selected', "Please upload your credentials to proceed.");
      return;
    }
    

    // Use fetched names for registered users, else use the state values
    const submitFirstName = isRegistered ? fetchedFirstName : firstName;
    const submitLastName = isRegistered ? fetchedLastName : lastName;

    if (!submitFirstName || !submitLastName) {
      Alert.alert('Missing Information', "Please fill in both first and last names.");
      return;
    }

    try {
      const response = await fetch(file.uri);
      const blob = await response.blob();
      
      // Create a reference to the file location in storage
      const fileRef = ref(storage, `tempUploads/${organizationId}/${file.name}`);
      await uploadBytes(fileRef, blob);
      const fileUrl = await getDownloadURL(fileRef);

      console.log('userType:', userType);
      console.log('userStatus:', userStatus);
      console.log('organizationId:', organizationId);
      console.log('organizationName:', organizationName);

      await setDoc(doc(firestore, 'professionals', user.uid), { firstName: submitFirstName, lastName: submitLastName }, { merge: true });
      console.log('Professional name added successfully!');

      await addDoc(collection(firestore, `organizations/${organizationId}/applications`), {
        fileUrl,
        pending: true,
        createdAt: new Date(),
        userType: userType,
        firstName: submitFirstName,
        lastName: submitLastName,
        professionalId: user.uid,
        status: userStatus,
      });
      console.log('Professional application added successfully!');

      await addDoc(collection(firestore, `notifications/${user.uid}/messages`), {
        organizationId,
        message: `Your application for ${organizationName} has been submitted.`,
        createdAt: new Date(),
        isRead: false,
        notificationType: 'Application',
        
      });
      console.log('Professional notification added successfully!');

      await addDoc(collection(firestore, `notifications/${organizationId}/messages`), {
        senderId: user.uid,
        message: `New application received from ${submitFirstName} ${submitLastName}.`,
        createdAt: new Date(),
        isRead: false,
        notificationType: 'Application',
        destination: `/pending-applications`
      });
      console.log('Organization notification added successfully!');

      Alert.alert('Success', 'Your application has been submitted.', [
        {
          text: 'OK',
          onPress: () => {
            if (isRegistered) {
              navigation.navigate('ProfessionalHome');
            }
          },
        },
      ]);
    } catch (error) {
      console.error('Error uploading file:', error);
      Alert.alert('Error', 'Could not upload file.');
    }
  };

  // Render based on registration status
  const renderContent = () => (
    <View style={styles.container}>
      {/* Title */}
      <Text style={styles.title}>Upload Credentials</Text>

      {/* Description */}
      <Text style={styles.description}>
        Join our community! If you’re passionate about mental health and want to make a difference, 
        apply to become a professional. Help those in need and contribute to a supportive environment. 
        Apply now and be a part of the positive impact!
      </Text>

      {/* Link to requirements */}
      <TouchableOpacity onPress={() => Linking.openURL('http://example.com')}>
        <Text style={styles.linkText}>See <Text style={styles.link}>here</Text> for the list of requirements.</Text>
      </TouchableOpacity>

      {/* Conditional rendering of inputs or fetched data */}
      {!isRegistered && (
        <>
          <Text style={styles.inputLabel}>First Name:</Text>
          <TextInput
            style={styles.inputBox}
            placeholder="Enter First Name"
            value={firstName}
            onChangeText={(text) => setFirstName(text)}
          />
          <Text style={styles.inputLabel}>Last Name:</Text>
          <TextInput
            style={styles.inputBox}
            placeholder="Enter Last Name"
            value={lastName}
            onChangeText={(text) => setLastName(text)}
          />
        </>
      )}

      {/* Upload Section */}
      <Text style={styles.uploadLabel}>Upload credentials</Text>
      <TouchableOpacity style={styles.uploadBox} onPress={pickDocument}>
        <MaterialIcons name="add" size={32} color="#6A0DAD" />
        <Text style={styles.uploadText}>
          {file ? file.name : 'Browse and choose the files you want to upload from your device.'}
        </Text>
      </TouchableOpacity>

      {/* Submit Button */}
      <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
        <Text style={styles.submitButtonText}>Submit</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    // Conditional rendering of the layout
    isRegistered ? (
      <RootLayout screenName={'UploadCredentials'} navigation={navigation}>
        {renderContent()}
      </RootLayout>
    ) : (
      renderContent() // Render without RootLayout for unregistered users
    )
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 15,
  },
  description: {
    fontSize: 14,
    textAlign: 'justify',
    marginBottom: 20,
    color: '#333',
    lineHeight: 20,
  },
  linkText: {
    fontSize: 14,
    color: '#333',
    textAlign: 'center',
    marginBottom: 25,
  },
  inputLabel: {
    fontSize: 16,
    marginBottom: 5,
    color: '#333',
  },
  inputBox: {
    borderWidth: 1,
    borderColor: '#000000',
    borderRadius: 8,
    padding: 10,
    marginBottom: 15,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  link: {
    color: '#6A0DAD',
    textDecorationLine: 'underline',
  },
  uploadLabel: {
    fontSize: 16,
    marginBottom: 10,
  },
  uploadBox: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#ccc',
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 30,
    borderRadius: 10,
  },
  uploadText: {
    marginTop: 10,
    textAlign: 'center',
    fontSize: 14,
    color: '#666',
  },
  submitButton: {
    backgroundColor: '#6A0DAD',
    paddingVertical: 15,
    borderRadius: 30,
    alignItems: 'center',
    marginBottom: 30,
  },
  submitButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
