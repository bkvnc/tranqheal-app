import React from 'react';
import { View, Image, StyleSheet, TouchableOpacity, Text } from 'react-native';

export const WelcomeScreen = ({ navigation }) => {
  return (
    <View style={styles.container}>
      {/* Logo Image */}
      <Image 
        source={require('../assets/tranqheal-logo.png')}  // Replace with the actual path to your logo file
        style={styles.logo}
        resizeMode="contain"
      />
      
      {/* Get Started Button */}
      <TouchableOpacity 
        style={styles.button} 
        onPress={() => navigation.navigate('RegisterAs')}>
        <Text style={styles.buttonText}>Get Started</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#CBC3E3', // Background color or gradient
  },
  logo: {
    width: 250,  // Adjust width and height based on logo dimensions
    height: 250,
    marginBottom: 100,
  },
  button: {
    backgroundColor: '#fff',
    paddingVertical: 15,
    paddingHorizontal: 60,
    borderRadius: 30,
    elevation: 3,
  },
  buttonText: {
    fontSize: 18,
    color: '#000',
  },
});