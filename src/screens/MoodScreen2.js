import React, { useState, useContext } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import {RootLayout} from '../navigation/RootLayout'
import { AuthenticatedUserContext } from '../providers';
import { getFirestore, doc, addDoc, collection } from 'firebase/firestore';
import { auth, firestore } from '../config';

export const MoodScreen2 = ({ route, navigation }) => {
  const [description, setDescription] = useState('');
  const { userType } = useContext(AuthenticatedUserContext);
  const { mood } = route.params;
  const handleSave = async () => {
    const user = auth.currentUser;
    if (user) {
      try {
        const userId = user.uid;
        const userMoodRef = doc(firestore, 'users', userId);
        const moodRef = collection(userMoodRef, 'moodTrackings');
        await addDoc(moodRef, {
          mood,
          description,
          timestamp: new Date(),
        });
        Alert.alert('Success', 'Your mood has been saved.');
        navigation.navigate('MoodResult');
      } catch (error) {
        console.error('Error saving mood:', error);
        Alert.alert('Error', 'Failed to save your mood. Please try again.');
      }
    } else {
      console.error('User not authenticated!');
    }
  };

  return (
    <RootLayout screenName={'Mood'} navigation={navigation} userType={userType}>
    <View style={styles.container}>

      {/* Prompt Message */}
      <View style={styles.promptContainer}>
        <Text style={styles.promptText}>
          Can you describe what might be causing you to feel this way?
        </Text>
      </View>

      {/* Input Box */}
      <TextInput
        style={styles.inputBox}
        placeholder="My day was..."
        value={description}
        onChangeText={text => setDescription(text)}
        multiline
      />

      {/* Next Button */}
      <TouchableOpacity 
        style={styles.button} 
        onPress={handleSave}
      >
        <Text style={styles.buttonText}>Save</Text>
      </TouchableOpacity>
    </View>
    </RootLayout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  promptContainer: {
    marginBottom: 20,
    alignItems: 'center',
  },
  promptText: {
    fontSize: 16,
    textAlign: 'center',
    fontWeight: '500',
  },
  inputBox: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 10,
    height: 150,
    fontSize: 16,
    textAlignVertical: 'top',
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#6200EE',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
})