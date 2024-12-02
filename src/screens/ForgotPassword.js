import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { TextInput, Button, FormErrorMessage } from '../components';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../config';
import { Colors } from '../config';

export const ForgotPassword = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [errorState, setErrorState] = useState('');

  const handlePasswordReset = async () => {
    try {
      if (!email) {
        setErrorState('Please enter your email address.');
        return;
      }
      await sendPasswordResetEmail(auth, email);
      Alert.alert(
        'Password Reset Email Sent',
        'Please check your email to reset your password.'
      );
      navigation.navigate('Login');
    } catch (error) {
      setErrorState(error.message);
      console.error('Error sending password reset email:', error);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Reset Password</Text>
      <TextInput
        name="email"
        placeholder="Enter your email address"
        autoCapitalize="none"
        keyboardType="email-address"
        textContentType="emailAddress"
        value={email}
        onChangeText={setEmail}
      />
      <FormErrorMessage error={errorState} visible={errorState !== ''} />
      <Button style={styles.button} onPress={handlePasswordReset}>
        <Text style={styles.buttonText}>Send Reset Link</Text>
      </Button>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: Colors.white,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 20,
    color: Colors.black,
  },
  button: {
    backgroundColor: Colors.purple,
    paddingVertical: 10,
    borderRadius: 5,
    marginTop: 20,
  },
  buttonText: {
    color: Colors.white,
    fontSize: 16,
    textAlign: 'center',
  },
});
