import React, { useContext} from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons'; // For icons
import { RootLayout } from '../navigation/RootLayout';
import { AuthenticatedUserContext } from '../providers';
import { Colors } from '../config';

export const MoodScreen = ({ navigation }) => {
  const { userType } = useContext(AuthenticatedUserContext);
  return (
    <RootLayout screenName={'Mood'} navigation={navigation} userType={userType}>
      <View style={styles.container}>
       
        {/* Message Box */}
        <View style={styles.messageBox}>
          <Text style={styles.messageText}>Good to see you!</Text>
          <Text style={styles.messageText}>Let's explore your mood.</Text>
        </View>

        {/* Mood Emoji */}
        <View style={styles.emojiContainer}>
          <Image
            source={require('../assets/moodscreen-smiley.jpg')} 
            style={styles.emojiImage}
          />
        </View>

        {/* Buttons */}
        <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('MoodMeter')}>
          <Text style={styles.buttonText}>LET'S DO IT</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('MoodLogs')}>
          <Text style={styles.buttonText}>Show Mood Logs</Text>
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
    height: 100, // Adjust size of the emoji
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
});

