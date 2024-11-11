import React, { useContext, useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { RootLayout } from '../navigation/RootLayout';
import { Colors, firestore, auth } from '../config';
import { AuthenticatedUserContext } from '../providers';
import { doc, getDoc } from 'firebase/firestore';

const fetchUserPreferences = async (userId) => {
  try {
    const userDocRef = doc(firestore, 'users', userId);
    const userDoc = await getDoc(userDocRef);
    
    if (userDoc.exists() && userDoc.data().preferences) {
      return { exists: true, data: userDoc.data().preferences };
    } else {
      return { exists: false };
    }
  } catch (error) {
    console.error('Error fetching user preferences:', error);
    return { exists: false };
  }
};

export const SAScreen = ({ navigation }) => {
  const { userType } = useContext(AuthenticatedUserContext);

  const handleNextPress = async () => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    const userId = currentUser.uid;
    const preferences = await fetchUserPreferences(userId);

    if (preferences.exists) {
      Alert.alert(
        "Preferences Found",
        "You have existing preferences. Would you like to update them?",
        [
          {
            text: "Yes",
            onPress: () => navigation.navigate("Preferences")
          },
          {
            text: "No",
            onPress: () => navigation.navigate("SelfAssessment2")
          }
        ]
      );
    } else {
      navigation.navigate("Preferences");
    }
  };

  const handleLogsPress = () => {
    navigation.navigate('SelfAssessmentLogs');
  };

  return (
    <RootLayout screenName={'SelfAssessment'} navigation={navigation} userType={userType}>
      <View style={styles.container}>
        {/* Top Right Logs Button */}
        <TouchableOpacity style={styles.logsButton} onPress={handleLogsPress}>
          <Ionicons name="time-outline" size={32} color={Colors.black} />
        </TouchableOpacity>

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
            onPress={() => {handleNextPress()}}
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
    justifyContent: 'space-between',  
  },
  logsButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    padding: 10,
    zIndex: 1,
  },
  title: {
    fontSize: 35,  
    fontWeight: 'bold',
    textAlign: 'left',
  },
  middleContainer: {
    justifyContent: 'center',  
    alignItems: 'center',      
    flex: 1,                   
  },
  subText: {
    fontSize: 20,
    textAlign: 'center',  
    marginHorizontal: 20, 
  },
  bottomContainer: {
    alignItems: 'center', 
  },
  bottomText: {
    fontSize: 15,
    color: Colors.grey,
    fontStyle: 'italic',
    marginBottom: 55,  
  },
  button: {
    backgroundColor: Colors.purple,  
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
