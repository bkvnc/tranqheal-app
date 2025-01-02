import React, { useState, useEffect } from 'react';
import { Text, StyleSheet, Image } from 'react-native';
import { Formik } from 'formik';
import { signInWithEmailAndPassword, signInWithCredential, GoogleAuthProvider } from 'firebase/auth';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import Constants from 'expo-constants';
import { doc, updateDoc } from 'firebase/firestore';
import * as Google from 'expo-auth-session/providers/google';
import { makeRedirectUri } from 'expo-auth-session';

import { View, TextInput, Button, FormErrorMessage } from '../components';
import { Images, Colors, googleAuth, auth, firestore } from '../config';
import { useTogglePasswordVisibility } from '../hooks';
import { loginValidationSchema } from '../utils';

export const LoginScreen = ({ navigation }) => {
  const [errorState, setErrorState] = useState("");
  const { passwordVisibility, handlePasswordVisibility, rightIcon } = useTogglePasswordVisibility();

  const [request, response, promptAsync] = Google.useAuthRequest({
    clientId: Constants.expoConfig?.extra?.webClientId,
    redirectUri: "https://auth.expo.io/@bkvnc/tranqheal-mobile",
    scopes: ['profile', 'email', 'openid'],
  });

  useEffect(() => {
    if (response?.type === 'success') {
      const { id_token } = response.params;
  
      // Proceed with Google sign-in
      const credential = GoogleAuthProvider.credential(id_token);
      signInWithCredential(googleAuth, credential)
        .then(() => {
          console.log('Successfully signed in with Google!');
        })
        .catch((error) => {
          setErrorState(error.message);
          console.error(error);
        });
    } else if (response?.type === 'error') {
      setErrorState('Google Sign-In failed.');
      console.error('Google Sign-In failed:', response.error);
    }
  }, [response]);
    

  // Handle email and password login
  const handleLogin = async (values) => {
    const { email, password } = values;
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      if (!user.emailVerified) {
        setErrorState("Email is not verified. Please check your inbox for a verification link.");
        const userDocRef = doc(firestore, "users", user.uid);
        await updateDoc(userDocRef, { emailStatus: "Unverified" });
        return;
      }
      const userDocRef = doc(firestore, "users", user.uid);
      await updateDoc(userDocRef, { emailStatus: "Verified" });
    } catch (error) {
      setErrorState(error.message);
    }
  };

  return (
    <View isSafe style={styles.container}>
      <KeyboardAwareScrollView enableOnAndroid={true}>
        {/* LogoContainer: consist app logo and screen title */}
        <View style={styles.logoContainer}>
          <Image source={require('../assets/tranqheal-logo.png')} style={styles.logo} />
          <Text style={styles.title}>Welcome back.</Text>
          <Text style={styles.subtitle}>Log In to your Account</Text>
        </View>

        <Formik
          initialValues={{ email: '', password: '' }}
          validationSchema={loginValidationSchema}
          onSubmit={(values) => handleLogin(values)}
        >
          {({
            values,
            touched,
            errors,
            handleChange,
            handleBlur,
            handleSubmit,
          }) => (
            <>
              {/* Input fields */}
              <TextInput
                name="email"
                leftIconName="email"
                placeholder="Enter Email"
                autoCapitalize="none"
                keyboardType="email-address"
                textContentType="emailAddress"
                autoFocus={true}
                value={values.email}
                onChangeText={handleChange('email')}
                onBlur={handleBlur('email')}
              />
              <FormErrorMessage error={errors.email} visible={touched.email} />

              <TextInput
                name="password"
                leftIconName="key-variant"
                placeholder="Enter password"
                autoCapitalize="none"
                autoCorrect={false}
                secureTextEntry={passwordVisibility}
                textContentType="password"
                rightIcon={rightIcon}
                handlePasswordVisibility={handlePasswordVisibility}
                value={values.password}
                onChangeText={handleChange("password")}
                onBlur={handleBlur("password")}
              />
              <FormErrorMessage error={errors.password} visible={touched.password} />

              {/* Display Screen Error Messages */}
              {errorState !== "" ? (
                <FormErrorMessage error={errorState} visible={true} />
              ) : null}

              {/* Forgot Password link */}
              <Text style={styles.forgotPassword} onPress={() => navigation.navigate("ForgotPassword")}>
                Forgot Password?
              </Text>

              {/* Login button */}
              <Button style={styles.button} onPress={handleSubmit}>
                <Text style={styles.buttonText}>Log In</Text>
              </Button>
            </>
          )}
        </Formik>

        {/* Footer for creating a new account */}
        <View style={styles.footer}>
          <Text>Don't have an account?</Text>
          <Text style={styles.signupLink} onPress={() => navigation.navigate('RegisterAs')}>
            Register
          </Text>
        </View>
      </KeyboardAwareScrollView>
    </View>
  );
};

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: Colors.white,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.black,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.grey,
    marginBottom: 20,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginTop: 10,
    color: Colors.purple,
    textDecorationLine: 'underline',
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
  orSignInText: {
    marginVertical: 20,
    fontSize: 14,
    textAlign: 'center',
    color: Colors.grey,
  },
  googleButton: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.grey,
    paddingVertical: 10,
    borderRadius: 5,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20,
  },
  googleText: {
    color: Colors.black,
    fontSize: 16,
    marginLeft: 10,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  signupLink: {
    color: Colors.purple,
    marginLeft: 5,
    textDecorationLine: 'underline',
  },
});