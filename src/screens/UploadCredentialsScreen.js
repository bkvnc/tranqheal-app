import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Linking } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { RootLayout } from '../navigation/RootLayout'; 

export const UploadCredentialsScreen = ({ navigation, route }) => {
  const { isRegistered } = route.params; // Get the registration status from params
  const [file, setFile] = useState(null); // To store the file chosen

  // Function to pick a document
  const pickDocument = async () => {
    let result = await DocumentPicker.getDocumentAsync({});
    if (result.type === 'success') {
      setFile(result);
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

      {/* Upload Section */}
      <Text style={styles.uploadLabel}>Upload credentials</Text>
      <TouchableOpacity style={styles.uploadBox} onPress={pickDocument}>
        <MaterialIcons name="add" size={32} color="#6A0DAD" />
        <Text style={styles.uploadText}>
          {file ? file.name : 'Browse and choose the files you want to upload from your device.'}
        </Text>
      </TouchableOpacity>

      {/* Submit Button */}
      <TouchableOpacity style={styles.submitButton}>
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
