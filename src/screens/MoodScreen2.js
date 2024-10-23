import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import {RootLayout} from '../navigation/RootLayout'

export const MoodScreen2 = ({ route, navigation }) => {
  
  const [description, setDescription] = useState('');

  return (
    <RootLayout screenName={'MoodScreen2'} navigation={navigation}>
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
      <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('MoodResult')}>
        <Text style={styles.buttonText}>Next</Text>
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
    height: 150, // Makes it larger like a textarea
    fontSize: 16,
    textAlignVertical: 'top',
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#6200EE', // Purple button
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
