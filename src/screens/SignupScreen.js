import React, { useState } from 'react';
import { Text, StyleSheet } from 'react-native';
import { Formik } from 'formik';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { View, TextInput, Logo, Button, FormErrorMessage } from '../components';
import { Images, Colors, auth, firestore } from '../config';
import { useTogglePasswordVisibility } from '../hooks';
import { signupValidationSchema, createUserInFirestore } from '../utils';
import { sendEmailVerification } from 'firebase/auth';

export const SignupScreen = ({ navigation, route }) => {
  const [errorState, setErrorState] = useState('');

  const { isRegistered, organizationId, organizationName, userType } = route.params; 

  const {
    passwordVisibility,
    handlePasswordVisibility,
    rightIcon,
    handleConfirmPasswordVisibility,
    confirmPasswordIcon,
    confirmPasswordVisibility,
  } = useTogglePasswordVisibility();

  const handleSignUp = async (values) => {
    const { email, password, username } = values;

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const userId = userCredential.user.uid;
      const user = userCredential.user;

      await sendEmailVerification(user);

      const collectionName = userType === 'professional' ? 'professionals' : 'users';      
      const userDoc = await createUserInFirestore(userId, username, email, collectionName, userType);
      const userStatus = userDoc && userDoc.status ? userDoc.status : 'Unverified';

      if (userType === 'professional') {
        if (organizationId) {
          console.log('Navigating to UploadCredentials');
          navigation.navigate('UploadCredentials', { organizationId, organizationName, userType, isRegistered, userStatus });
        } else {
          console.log('Professional without organization selected.');
          navigation.navigate('Login');
        }
      } else {
        console.log('User signed up successfully! Please verify your email.');
        setErrorState('Please check your email for verification.');
        navigation.navigate('Login');
      }
    } catch (error) {
      console.log('Error creating user:', error.message);
      setErrorState(error.message);
    }
  };

  return (
    <View isSafe style={styles.container}>
      <KeyboardAwareScrollView enableOnAndroid={true}>
        {/* LogoContainer: app logo and screen title */}
        <View style={styles.loginContainer}>
          <Logo uri={Images.logo} style={styles.logo} />
          <Text style={styles.title}>Create an account.</Text>
        </View>

        <Formik
          initialValues={{ email: '', password: '', confirmPassword: '', username: '' }}
          validationSchema={signupValidationSchema}
          onSubmit={(values) => handleSignUp(values)}
        >
          {({
            values,
            touched,
            errors,
            handleChange,
            handleSubmit,
            handleBlur,
          }) => (
            <>
              {/* Input fields */}
              <TextInput
                name="username"
                leftIconName="account"
                placeholder="Enter Username"
                autoCapitalize="none"
                keyboardType="username"
                textContentType="username"
                value={values.username}
                onChangeText={handleChange('username')}
                onBlur={handleBlur('username')}
              />
              <FormErrorMessage error={errors.username} visible={touched.username} />
              <TextInput
                name="email"
                leftIconName="email"
                placeholder="Enter email"
                autoCapitalize="none"
                keyboardType="email-address"
                textContentType="emailAddress"
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
                textContentType="newPassword"
                rightIcon={rightIcon}
                handlePasswordVisibility={handlePasswordVisibility}
                value={values.password}
                onChangeText={handleChange('password')}
                onBlur={handleBlur('password')}
              />
              <FormErrorMessage
                error={errors.password}
                visible={touched.password}
              />

              <TextInput
                name="confirmPassword"
                leftIconName="key-variant"
                placeholder="Confirm password"
                autoCapitalize="none"
                autoCorrect={false}
                secureTextEntry={confirmPasswordVisibility}
                textContentType="password"
                rightIcon={confirmPasswordIcon}
                handlePasswordVisibility={handleConfirmPasswordVisibility}
                value={values.confirmPassword}
                onChangeText={handleChange('confirmPassword')}
                onBlur={handleBlur('confirmPassword')}
              />
              <FormErrorMessage
                error={errors.confirmPassword}
                visible={touched.confirmPassword}
              />

              {/* Display Screen Error Messages */}
              {errorState !== '' ? (
                <FormErrorMessage error={errorState} visible={true} />
              ) : null}

              {/* Signup button */}
              <Button style={styles.button} onPress={handleSubmit}>
                <Text style={styles.buttonText}>Register</Text>
              </Button>
            </>
          )}
        </Formik>

        {/* Login link */}
        <View style={styles.loginContainer}>
          <Text>
            Already have an account?{' '}
            <Text
              style={styles.loginLink}
              onPress={() => navigation.navigate('Login')}
            >
              Login
            </Text>
          </Text>
        </View>
      </KeyboardAwareScrollView>
    </View>
  );
};

// Adjust styles accordingly
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: Colors.white,
  },
  loginContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginVertical: 10,
  },
  button: {
    backgroundColor: Colors.purple,
    padding: 15,
    borderRadius: 25,
    alignItems: 'center',
    marginVertical: 10,
  },
  buttonText: {
    color: Colors.white,
    fontWeight: 'bold',
    fontSize: 18,
  },
  loginLink: {
    color: Colors.purple,
    fontWeight: 'bold',
  },
});
