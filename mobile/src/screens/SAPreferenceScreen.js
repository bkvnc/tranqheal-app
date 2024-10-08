import React, { useState, useContext } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Image } from 'react-native';
import RadioGroup from 'react-native-radio-buttons-group';  
import { RootLayout } from '../navigation/RootLayout';
import { AuthenticatedUserContext } from '../../shared/providers';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import { auth, firestore } from '../../shared/config';

export const SAPreferenceScreen = ({navigation}) => {
  const { userType } = useContext(AuthenticatedUserContext);
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [availability, setAvailability] = useState(''); 

  const user = auth.currentUser;

  const handleSavePreferences = async () => {
    if (user) {
      try {
        const userId = user.uid;
        const userDocRef = doc(firestore, 'users', userId);
        await setDoc(userDocRef, {
          preferences: {
            preferredProfAge: age,
            preferredProfGender: gender,
            preferredProfAvailability: availability,
          }
        }, { merge: true });
        navigation.navigate('SelfAssessment2');
      } catch (error) {
        console.error('Error saving preferences:', error);
      }
    } else {
      console.error('User not authenticated!');
    }
  };

  const genderOptions = [
    { id: '1', label: 'Male', value: 'male' },
    { id: '2', label: 'Female', value: 'female' },
  ];

  const availabilityOptions = [
    { id: '1', label: 'Morning', value: 'morning' },
    { id: '2', label: 'Afternoon', value: 'afternoon' },
    { id: '3', label: 'Evening', value: 'evening' },
  ];

  return (
    <RootLayout navigation={navigation} screenName={'Preferences'} userType={userType}>
      <View style={styles.container}>
      
    
      {/* Title */}
      <Text style={styles.title}>Preferences</Text>

      {/* Age Input */}
      <View style={styles.inputSection}>
        <Text style={styles.label}>Age of Professional</Text>
        <TextInput
          style={styles.input}
          value={age}
          onChangeText={setAge}
          keyboardType="numeric"
          placeholder="Enter age"
        />
      </View>

      {/* Gender Selection */}
      <View style={styles.inputSection}>
        <Text style={styles.label}>Gender of Professional</Text>
        <RadioGroup
          radioButtons={genderOptions}
          onPress={(id) => setGender(genderOptions.find(option => option.id === id)?.value)}
          selectedId={genderOptions.find(option => option.value === gender)?.id}
          layout="row"
        />
      </View>

      {/* Availability Selection */}
      <View style={styles.inputSection}>
        <Text style={styles.label}>Availability</Text>
        <RadioGroup
          radioButtons={availabilityOptions}
          onPress={(id) => setAvailability(availabilityOptions.find(option => option.id === id)?.value)}
          selectedId={availabilityOptions.find(option => option.value === availability)?.id}
          layout="row"
        />
      </View>

      {/* Next Button */}
      <TouchableOpacity style={styles.button} onPress={handleSavePreferences}>
        <Text style={styles.buttonText}>Next</Text>
      </TouchableOpacity>
    </View>
    </RootLayout>
    
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
  },
  icon: {
    width: 24,
    height: 24,
  },
  logo: {
    width: 40,
    height: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 30,
    marginTop: 45,
  },
  inputSection: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    padding: 10,
    fontSize: 16,
  },
  button: {
    backgroundColor: '#6200ee',
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 25,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});