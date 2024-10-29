import React, { useContext } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { RootLayout } from '../navigation/RootLayout';
import { Colors } from '../config';
import { AuthenticatedUserContext } from '../providers';


export const SAScreen = ({ navigation }) => {
  const { userType } = useContext(AuthenticatedUserContext);
  return (
    <RootLayout screenName={'SelfAssessment'} navigation={navigation} userType={userType}>
      <View style={styles.container}>
        {/* Top Left Greeting */}
        <Text style={styles.title}>Self Assessment</Text>
        
        {/* Centered Subtext */}
        <View style={styles.middleContainer}>
          <Text style={styles.subText}>
            Welcome to your self-assessment! This quick and easy check-in helps us understand your well-being better and tailor our support to your needs. Let’s get started!
          </Text>
        </View>
        
        {/* Bottom Text and Button */}
        <View style={styles.bottomContainer}>
          <Text style={styles.bottomText}>
            Disclaimer: The series of test is a self-administered instrument used in primary care settings. This assessment is <Text style={{ color: 'red', fontWeight: 'bold', fontStyle: 'italic' }}>NOT</Text> a diagnostic test. Please consult your doctor or a professional if you are concerned about your well-being.
          </Text>
          <TouchableOpacity 
            style={styles.button} 
            onPress={() => navigation.navigate('Preferences')} // Replace 'NextScreen' with your target screen name
          >
            <Text style={styles.buttonText}>Next</Text>
          </TouchableOpacity>
        </View>
      </View>
    </RootLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'space-between',  // Ensure spacing between top, middle, and bottom sections
  },
  title: {
    fontSize: 35,  // Larger font for title effect
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 20,
  },
  middleContainer: {
    justifyContent: 'center',  // Center vertically
    alignItems: 'center',      // Center horizontally
    flex: 1,                   // Takes up remaining space
  },
  subText: {
    fontSize: 20,
    textAlign: 'center',  // Center text
    marginHorizontal: 20, // Optional: add padding to avoid touching the screen edges
  },
  bottomContainer: {
    alignItems: 'center',  // Center the bottom text and button
  },
  bottomText: {
    fontSize: 15,
    color: Colors.grey,
    fontStyle: 'italic',
    marginBottom: 55,  // Add spacing between text and button
  },
  button: {
    backgroundColor: Colors.purple,  // Button color
    paddingVertical: 15,
    paddingHorizontal: 100,
    borderRadius: 30,
  },
  buttonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
});
