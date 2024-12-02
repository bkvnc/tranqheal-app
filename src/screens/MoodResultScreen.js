import React, { useContext, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons'; // For icons
import { RootLayout } from '../navigation/RootLayout';
import { AuthenticatedUserContext } from 'src/providers';
import { Colors } from 'src/config';

export const MoodResultScreen = ({ navigation, route }) => {
  const { userType } = useContext(AuthenticatedUserContext);
  const { selectedMood, suggestion } = route.params;

  useEffect(() => {
    console.log('Selected Mood:', selectedMood);
    console.log('Suggestion:', suggestion);
  }, [selectedMood, suggestion]);

  return (
    <RootLayout screenName={'Mood'} navigation={navigation} userType={userType}>
      <View style={styles.container}>
       
        {/* Message Box */}
        <View style={styles.messageBox}>
          <Text style={styles.suggestionText}>{suggestion}</Text>
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
    backgroundColor: Colors.white,
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
    backgroundColor: Colors.purple,
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
  messageBox: {
    backgroundColor: '#F9F9F9', 
    padding: 20, 
    borderRadius: 15, 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 4 }, 
    shadowOpacity: 0.1, 
    shadowRadius: 8, 
    elevation: 5, 
    alignItems: 'center', 
    marginBottom: 20, 
  },
  suggestionText: {
    fontSize: 18, 
    textAlign: 'justify', 
    fontWeight: '600', 
    color: '#333', 
    lineHeight: 24, 
  },
});
