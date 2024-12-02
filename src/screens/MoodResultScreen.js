import React, { useContext, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons'; // For icons
import { RootLayout } from '../navigation/RootLayout';
import { AuthenticatedUserContext } from 'src/providers';

export const MoodResultScreen = ({ navigation, route }) => {
  const { userType } = useContext(AuthenticatedUserContext);
  const { selectedMood, suggestions } = route.params;

  useEffect(() => {
    console.log('Selected Mood:', selectedMood);
    console.log('Suggestion:', suggestions);
  }, [selectedMood, suggestions]);

  return (
    <RootLayout screenName={'Mood'} navigation={navigation} userType={userType}>
      <View style={styles.container}>
       
        {/* Message Box */}
        <View style={styles.messageBox}>
          <Text style={styles.messageText}>Based on your input, we recommend:</Text>
          {suggestions.map((item, index) => (
            <Text key={index} style={styles.suggestionText}>{item}</Text>
          ))}
        </View>

        {/* Mood Emoji */}
        <View style={styles.emojiContainer}>
          <Image
            source={require('../assets/moodscreen-smiley.jpg')} 
            style={styles.emojiImage}
          />
        </View>

        {/* Buttons */}
        <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('Home')}>
          <Text style={styles.buttonText}>Finish</Text> 
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  logoContainer: {
    flex: 1,
    alignItems: 'center',
  },
  logo: {
    fontSize: 24,
  },
  messageBox: {
    alignItems: 'center',
    marginBottom: 20,
  },
  messageText: {
    fontSize: 18,
    textAlign: 'center',
    fontWeight: 'bold',
    marginVertical: 5,
  },
  emojiContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  emojiImage: {
    width: 100,
    height: 100,
  },
  button: {
    backgroundColor: '#6A0DAD',
    paddingVertical: 15,
    borderRadius: 30,
    alignItems: 'center',
    marginBottom: 20,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  suggestionText: {
    fontSize: 16,
    marginVertical: 5,
    color: '#333',
  },
});
