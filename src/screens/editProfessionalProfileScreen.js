import React, { useEffect, useContext, useState } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import RNPickerSelect from 'react-native-picker-select';
import { RootLayout } from '../navigation/RootLayout';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, firestore, Colors } from '../config';
import { AuthenticatedUserContext } from '../providers';

export const EditProfessionalProfileScreen = ({ navigation }) => {
  const { userType } = useContext(AuthenticatedUserContext);
  const [firstName, setFirstName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [lastName, setLastName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [facebookLink, setFacebookLink] = useState('');
  const [availability, setAvailability] = useState({ morning: false, afternoon: false, evening: false });
  const [specialization, setSpecialization] = useState({ depress: false, anxiety: false, stress: false });

  useEffect(() => {
    const fetchProfileData = async () => {
      const user = auth.currentUser;
      if (!user) return;

      const userRef = doc(firestore, 'professionals', user.uid);
      const userDoc = await getDoc(userRef);

      if (userDoc.exists()) {
        const data = userDoc.data();
        // Set to existing data if available
        setFirstName(data.firstName || '');
        setMiddleName(data.middleName || '');
        setLastName(data.lastName || '');
        setAge(data.age || '');
        setGender(data.gender || '');
        setMobileNumber(data.mobileNumber || '');
        setFacebookLink(data.facebookLink || '');
        setAvailability(data.availability || {});
        setSpecialization(data.specialization || {});
      }
    };

    fetchProfileData();
  }, []);

  const handleSubmit = async () => {
    const user = auth.currentUser;
    if (!user) {
      alert('User not authenticated!');
      return;
    }

    const profileData = {
      firstName,
      middleName,
      lastName,
      age,
      gender,
      mobileNumber,
      facebookLink,
      availability,
      specialization,
    };

    try {
      await setDoc(doc(firestore, 'professionals', user.uid), profileData, { merge: true });
      alert('Profile updated successfully!');
      console.log('Profile updated successfully:', profileData);
      navigation.navigate('ProfessionalProfile', { updatedProfileData: profileData });
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to update profile. Please try again.');
    }
  };

  return (
    <RootLayout navigation={navigation} screenName="EditProfessionalProfile" userType={userType}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <View style={styles.container}>
            <Text style={styles.title}>Please provide your information.</Text>

            {/* First Name */}
            <View style={styles.editRow}>
              <Text style={styles.label}>First Name:</Text>
              <TextInput 
                style={styles.input} 
                placeholder="Enter First Name" 
                value={firstName}
                onChangeText={setFirstName}
              />
            </View>

            {/* Middle Name */}
            <View style={styles.editRow}>
              <Text style={styles.label}>Middle Name:</Text>
              <TextInput 
                style={styles.input} 
                placeholder="Enter Middle Name" 
                value={middleName}
                onChangeText={setMiddleName}
              />
            </View>

            {/* Last Name */}
            <View style={styles.editRow}>
              <Text style={styles.label}>Last Name:</Text>
              <TextInput 
                style={styles.input} 
                placeholder="Enter Last Name" 
                value={lastName}
                onChangeText={setLastName}
              />
            </View>

            {/* Age with smaller width */}
            <View style={styles.editRow}>
              <Text style={styles.label}>Age:</Text>
              <TextInput 
                style={styles.input} 
                placeholder="Enter Age" 
                keyboardType="numeric" 
                value={age}
                onChangeText={setAge}
              />
            </View>

            {/* Gender (Dropdown) */}
            <View style={styles.editRow}>
              <Text style={styles.label}>Gender:</Text>
              <View style={styles.pickerContainer}>
                <RNPickerSelect
                  onValueChange={(value) => setGender(value)}
                  items={[
                    { label: 'Male', value: 'Male' },
                    { label: 'Female', value: 'Female' },
                    { label: 'Other', value: 'Other' },
                  ]}
                  placeholder={{ label: 'Select Gender', value: null }}
                  style={{
                    inputIOS: styles.pickerText,
                    inputAndroid: styles.pickerText, // Same style for Android
                  }}
                />
              </View>
            </View>

            {/* Mobile Number */}
            <View style={styles.editRow}>
              <Text style={styles.label}>Mobile Number:</Text>
              <TextInput 
                style={styles.input} 
                placeholder="Enter Mobile Number" 
                keyboardType="phone-pad" 
                value={mobileNumber}
                onChangeText={setMobileNumber}
              />
            </View>

            {/* Facebook/Messenger Link */}
            <View style={styles.editRow}>
              <Text style={styles.label}>Facebook/Messenger Link:</Text>
              <TextInput 
                style={styles.input} 
                placeholder="Enter Link"
                value={facebookLink}
                onChangeText={setFacebookLink}
              />
            </View>

            {/* Availability */}
            <Text style={styles.buttonLabel}>Availability</Text>
            <View style={styles.buttonContainer}>
              <TouchableOpacity style={styles.buttonCheck} onPress={() => setAvailability({ ...availability, morning: !availability.morning })}>
                <Text style={styles.morningButton}>Morning</Text>
                <Text style={{ fontWeight: availability.morning ? 'bold' : 'normal' }}>
                  {availability.morning ? '✓' : ''}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.buttonCheck} onPress={() => setAvailability({ ...availability, afternoon: !availability.afternoon })}>
                <Text style={styles.afternoonButton}>Afternoon</Text>
                <Text style={{ fontWeight: availability.afternoon ? 'bold' : 'normal' }}>
                  {availability.afternoon ? '✓' : ''}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.buttonCheck} onPress={() => setAvailability({ ...availability, evening: !availability.evening })}>
                <Text style={styles.eveningButton}>Evening</Text>
                <Text style={{ fontWeight: availability.evening ? 'bold' : 'normal' }}>
                  {availability.evening ? '✓' : ''}
                </Text>
              </TouchableOpacity>
            </View>
            
            {/* Specialization */}
            <Text style={styles.buttonLabel}>Specialization</Text>
            <View style={styles.buttonContainer}>
              <TouchableOpacity style={styles.buttonCheck} onPress={() => setSpecialization({ ...specialization, depress: !specialization.depress })}>
                <Text style={styles.specializationButton}>Depress</Text>
                <Text style={{ fontWeight: specialization.depress ? 'bold' : 'normal' }}>
                  {specialization.depress ? '✓' : ''}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.buttonCheck} onPress={() => setSpecialization({ ...specialization, anxiety: !specialization.anxiety })}>
                <Text style={styles.specializationButton}>Anxiety</Text>
                <Text style={{ fontWeight: specialization.anxiety ? 'bold' : 'normal' }}>
                  {specialization.anxiety ? '✓' : ''}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.buttonCheck} onPress={() => setSpecialization({ ...specialization, stress: !specialization.stress })}>
                <Text style={styles.specializationButton}>Stress</Text>
                <Text style={{ fontWeight: specialization.stress ? 'bold' : 'normal' }}>
                  {specialization.stress ? '✓' : ''}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>

        {/* Submit Button */}
        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
          <Text style={styles.submitButtonText}>Submit</Text>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </RootLayout>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    paddingBottom: 100, // Space for the button
  },
  container: {
    flex: 1,
    padding: 10,
    backgroundColor: Colors.white,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  editRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 10,
  },
  label: {
    fontSize: 16,
    marginRight: 10,
    width: 130,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: Colors.grey,
    padding: 5,
    borderRadius: 12,
    height: 40,
  },
  buttonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 10,
    justifyContent: 'space-between',
  },
  buttonCheck: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  buttonLabel: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 10,
    fontWeight: 'bold',
  },
  morningButton: {
    fontSize: 16,
    color: Colors.yellow,
    fontWeight: 'bold',
  },
  afternoonButton: {
    fontSize: 16,
    color: Colors.orange,
    fontWeight: 'bold',
  },
  eveningButton: {
    fontSize: 16,
    color: Colors.darkBlue,
    fontWeight: 'bold',
  },
  specializationButton: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  pickerText: {
    fontSize: 16,
    textAlign: 'center',
    paddingVertical: 10,
  },
  submitButton: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    backgroundColor: '#7129F2',
    paddingVertical: 15,
    borderRadius: 100,
    marginHorizontal: 20,
    alignItems: 'center',
  },
  submitButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  pickerContainer: {
    flex: 1,
    borderWidth: 1,
    borderColor: 'gray',
    borderRadius: 12,
    justifyContent: 'center', 
    height: 40, // Center the picker vertically
  },
});