import React from 'react';
import { View, Image, StyleSheet, TouchableOpacity, Text, ScrollView } from 'react-native';

export const ProfessionalRegisterScreen = ({ navigation }) => {
  return (
    <View style={styles.container}>
      {/* Logo Image */}
      <Image 
        source={require('../assets/tranqheal-logo.png')}  // Replace with the actual path to your logo file
        style={styles.logo}
        resizeMode="contain"
      />

      {/* Main Text */}
      <Text style={styles.mainText}>Are you part on any of this organizations?</Text>
      
      {/* List of Organizations */}
      <ScrollView style={styles.orgList}>
        <Text style={styles.listItem}>• Kalinaw Mind Center</Text>
        <Text style={styles.listItem}>• Mental Center</Text>
        <Text style={styles.listItem}>• Private Org</Text>
        <Text style={styles.listItem}>• Organizations</Text>
        {/* 'See More' Link */}
        <Text style={styles.seeMore}>See more</Text>
      </ScrollView>

      {/* Yes Button */}
      <TouchableOpacity 
        style={styles.button}
        //onPress={() => navigation.navigate('SignUp')}
        onPress={() => navigation.navigate('UploadCredentials')}  
      >
        <Text style={styles.buttonText}>Yes</Text>
      </TouchableOpacity>
      
      {/* No Button */}
      <TouchableOpacity 
        style={styles.button}
        onPress={() => navigation.navigate('RegisterAs')}
      >
        <Text style={styles.buttonText}>No</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',  // White background
    paddingHorizontal: 20,  // Padding to prevent items from touching the edges
  },
  logo: {
    width: 150,   // Adjusted size for better alignment
    height: 150,  // Adjusted size for better alignment
    marginBottom: 20,  // Space between logo and text/buttons
  },
  mainText: {
    fontSize: 22,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 20,
    color: '#000',
  },
  orgList: {
    marginBottom: 20,
    maxHeight: 150,  // To prevent overflow of the list
  },
  listItem: {
    fontSize: 16,
    marginBottom: 5,
    color: '#000',
  },
  seeMore: {
    color: '#2D9CDB',  // Blue color for 'See more'
    fontSize: 16,
    marginTop: 5,
  },
  button: {
    backgroundColor: '#9B51E0',  // Purple button color
    borderRadius: 25,  // Rounded button
    paddingVertical: 15,
    paddingHorizontal: 60,  // Wider buttons
    marginVertical: 10,  // Space between buttons
    width: 250,  // Fixed button width
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',  // White text color
    fontSize: 18,
    fontWeight: 'bold',
  }
});
