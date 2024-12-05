import React from 'react';
import { View, Image, StyleSheet, TouchableOpacity, Text } from 'react-native';

export const RegisterAsScreen = ({ navigation }) => {
  return (
    <View style={styles.container}>
      <Image 
        source={require('../assets/tranqheal-logo.png')}
        style={styles.logo}
        resizeMode="contain"
      />

      <View style={styles.centerContent}>
        <Text style={styles.textStyle}>Register as?</Text>

        <TouchableOpacity 
          style={styles.button}
          onPress={() => navigation.navigate('Signup', { userType: 'seeker' })}
        >
          <Text style={styles.buttonText}>Seeker</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.button}
          onPress={() => navigation.navigate('ProfessionalRegister', { userType: 'professional' })} 
        >
          <Text style={styles.buttonText}>Professional</Text>
        </TouchableOpacity>

        <Text style={styles.textStyle}>Already Have an Account?</Text>
        <TouchableOpacity 
          style={styles.button}
          onPress={() => navigation.navigate('Login')} 
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
    backgroundColor: '#fff', 
  },
  logo: {
    width: 300,  
    height: 300, 
    marginTop: 50,  
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
    backgroundColor: '#9B51E0',
    borderRadius: 25,  
    paddingVertical: 15,
    paddingHorizontal: 30,
    marginVertical: 10,  
    width: 250,  
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',  
    fontSize: 18,
    fontWeight: 'bold',
  }
});