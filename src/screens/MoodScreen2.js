import React, { useState, useContext } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import axios from 'axios';
import {RootLayout} from '../navigation/RootLayout'
import { AuthenticatedUserContext } from '../providers';
import { getFirestore, doc, addDoc, collection } from 'firebase/firestore';
import { auth, firestore } from '../config';
import { moodMap } from '../utils/moodMap';

export const MoodScreen2 = ({ route, navigation }) => {
  const [description, setDescription] = useState('');
  const { userType } = useContext(AuthenticatedUserContext);
  const { selectedMood: mood } = route.params;

  const preprocessText = (text) => {
    const lowerCasedText = text.toLowerCase();
    const cleanedText = lowerCasedText.replace(/[^a-zA-Z0-9\s]/g, '');
    return cleanedText;  
  }

  const getEmbedding = async (text) => {
    const model = 'sentence-transformers/all-MiniLM-L6-v2';
    const apiUrl = `https://api-inference.huggingface.co/models/${model}`;
    const token = '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';

    try {
      const payload = { inputs: [text] };
      console.log('payload: ', payload);
      const response = await axios.post(apiUrl, payload, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      return response.data;
    } catch (error) {
      console.error('Error getting embedding:', error);
      throw error;
    }
  };

  const getSentiment = async (text) => {
    const model = 'distilbert/distilbert-base-uncased-finetuned-sst-2-english';
    const apiUrl = `https://api-inference.huggingface.co/models/${model}`;
    const token = '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';

    try {
        const response = await axios.post(apiUrl, { inputs: text }, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        return response.data;
    } catch (error) {
        console.error('Error getting sentiment:', error);
        throw error;
    }
  };

  const getEmotion = async (text) => {
    const model = 'j-hartmann/emotion-english-distilroberta-base';
    const apiUrl = `https://api-inference.huggingface.co/models/${model}`;
    const token = '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';

    try {
        const response = await axios.post(apiUrl, { inputs: text }, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        return response.data;
    } catch (error) {
        console.error('Error getting emotion:', error);
        throw error;
    }
  };

  const handleSave = async () => {
    const user = auth.currentUser;

    if (user) {
      try {
        const userId = user.uid;
        const userMoodRef = doc(firestore, 'users', userId);
        const moodRef = collection(userMoodRef, 'moodTrackings');

        const moodValue = moodMap[mood];
        const processedDescription = preprocessText(description);
        const descriptionEmbedding = await getEmbedding(processedDescription);
        const sentiment = await getSentiment(processedDescription);
        const emotion = await getEmotion(processedDescription);

        await addDoc(moodRef, {
          mood,
          moodValue,
          description: processedDescription,
          descriptionEmbedding,
          sentiment,
          emotion,
          timestamp: new Date(),
        });
        Alert.alert('Success', 'Your mood has been saved.');
        console.log('Mood: ', mood);
        console.log('Mood Value: ', moodValue);
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
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
