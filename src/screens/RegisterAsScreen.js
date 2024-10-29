import React from 'react';
import { View, Image, StyleSheet, TouchableOpacity, Text } from 'react-native';

export const RegisterAsScreen = ({ navigation }) => {
  return (
    <View style={styles.container}>
      {/* Logo Image */}
      <Image 
        source={require('../assets/tranqheal-logo.png')}  // Replace with the actual path to your logo file
        style={styles.logo}
        resizeMode="contain"
      />

      <View style={styles.centerContent}>
                {/* Register As Text */}
                <Text style={styles.textStyle}>Register as?</Text>
        
        {/* Seeker Button */}
        <TouchableOpacity 
          style={styles.button}
          onPress={() => navigation.navigate('Signup', { userType: 'seeker' })} // Adjust navigation
        >
          <Text style={styles.buttonText}>Seeker</Text>
        </TouchableOpacity>
        
        {/* Professional Button */}
        <TouchableOpacity 
          style={styles.button}
          onPress={() => navigation.navigate('ProfessionalRegister', { userType: 'professional' })} // Adjust navigation
        >
          <Text style={styles.buttonText}>Professional</Text>
        </TouchableOpacity>

        <Text style={styles.textStyle}>Already Have an Account?</Text>
        <TouchableOpacity 
          style={styles.button}
          onPress={() => navigation.navigate('Login')} // Adjust navigation
        >
          <Text style={styles.buttonText}>Login</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    backgroundColor: '#fff',  // White background
  },
  logo: {
    width: 300,   // Adjust the size of the logo as needed
    height: 300,  // Adjust the size of the logo as needed
    marginTop: 50,  // Space between logo and text/buttons
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  textStyle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
    marginTop: 15,
    color: '#000',
  },
  button: {
    backgroundColor: '#9B51E0', // Purple button color
    borderRadius: 25,  // Rounded button
    paddingVertical: 15,
    paddingHorizontal: 30,
    marginVertical: 10,  // Space between the two buttons
    width: 250,  // Adjust button width as needed
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',  // White text color
    fontSize: 18,
    fontWeight: 'bold',
  }
});