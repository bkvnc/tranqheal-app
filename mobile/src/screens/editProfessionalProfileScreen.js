import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import RNPickerSelect from 'react-native-picker-select';
import { RootLayout } from '../navigation/RootLayout';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, firestore } from '../../shared/config';

export const EditProfessionalProfileScreen = ({ navigation }) => {
    

  const [firstName, setFirstName] = React.useState('');
  const [middleName, setMiddleName] = React.useState('');
  const [lastName, setLastName] = React.useState('');
  const [age, setAge] = React.useState('');
  const [gender, setGender] = React.useState('');
  const [mobileNumber, setMobileNumber] = React.useState('');
  const [facebookLink, setFacebookLink] = React.useState('');

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
      }
    };

    fetchProfileData();
  }, []);

  const handleSubmit = async () => {
    const user = auth.currentUser;
    if(!user) {
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
    };

    try {
      await setDoc(doc(firestore, 'professionals', user.uid), profileData, { merge: true });
      alert('Profile updated successfully!');
      console.log('Profile updated successfully:', profileData);
      navigation.navigate('ProfessionalProfile', { updatedProfileData: profileData});
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to update profile. Please try again.');
    }
  };

  return (
    <RootLayout navigation={navigation} screenName="EditProfessionalProfile">
      <ScrollView>
        <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'} // Different behavior for iOS and Android
            keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0} // Adjust offset as needed for iOS
        >
            <View style={{ flex: 1, backgroundColor: 'white' }}>
            <ScrollView style={{ flex: 1, padding: 10 }}>
                <Text style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 20 }}>
                Please provide your information.
                </Text>

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
                    style={[styles.input]} 
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
            </ScrollView>

            {/* Submit Button */}
            <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
                <Text style={styles.submitButtonText}>Submit</Text>
            </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
       </ScrollView> 
    </RootLayout>
  );
};

const styles = StyleSheet.create({
  editRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 10,
  },
  label: {
    fontSize: 16,
    marginRight: 10, // Adds space between the label and input
    width: 130, // Ensures labels have consistent width
  },
  input: {
    flex: 1, // Makes the input take up the remaining space
    borderWidth: 1,
    borderColor: 'gray',
    padding: 5,
    borderRadius: 12,
    height: 40,
  },
  pickerContainer: {
    flex: 1,
    borderWidth: 1,
    borderColor: 'gray',
    borderRadius: 12,
    justifyContent: 'center', 
    height: 40, // Center the picker vertically
  },
  pickerText: {
    fontSize: 16,
    textAlign: 'center', // Centers the text horizontally in the picker
    paddingVertical: 10, // Ensures text is centered vertically
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
});
