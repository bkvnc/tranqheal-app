import React, { useContext } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { RootLayout } from '../navigation/RootLayout';
import { Colors } from '../config';
import { AuthenticatedUserContext } from '../providers';

import profImage from '../assets/testProfProfile.jpg';

export const SeekProfessionalScreen = ({ navigation }) => {
  const { userType } = useContext(AuthenticatedUserContext);

  // Mock professional details
  const professional = {
    name: 'Dr. Jane Smith',
    specialty: 'Therapist',
    image: profImage, // Replace with actual image URL
  };

  return (
    <RootLayout screenName={'SeekProfessional'} navigation={navigation} userType={userType}>
      <View style={styles.container}>
        {/* Title */}
        <Text style={styles.title}>Seek Professional</Text>
        
        {/* Professional Card */}
        <View style={styles.professionalCard}>
          <Image source={ professional.image} style={styles.profileImage} />
          <Text style={styles.professionalName}>{professional.name}</Text>
          <Text style={styles.specialty}>{professional.specialty}</Text>
        </View>
        
        {/* Send Request Button */}
        <TouchableOpacity 
          style={styles.button} 
          onPress={() => navigation.navigate('')}  // 
        >
          <Text style={styles.buttonText}>Send Request</Text>
        </TouchableOpacity>
      </View>
    </RootLayout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 35,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 20,
  },
  professionalCard: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    borderRadius: 15,
    backgroundColor: Colors.lightPurple,
    marginVertical: 20,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 15,
  },
  professionalName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.black,
    textAlign: 'center',
  },
  specialty: {
    fontSize: 18,
    color: Colors.grey,
    textAlign: 'center',
    marginTop: 5,
  },
  button: {
    backgroundColor: Colors.purple,
    paddingVertical: 15,
    paddingHorizontal: 100,
    borderRadius: 30,
    alignSelf: 'center',
  },
  buttonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
});
