import React, { useEffect, useState, useContext } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { RootLayout } from '../navigation/RootLayout';
import { AuthenticatedUserContext } from '../providers';
import { Colors } from '../config';

export const MoodProcessScreen = ({ route, navigation }) => {
  const { selectedMood } = route.params;
  const { userType } = useContext(AuthenticatedUserContext);
  const [isloading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [suggestion, setSuggestion] = useState(null);

  useEffect(() => {
    const fetchSuggestion = async () => {
      try {
        const response = await fetch('https://tranqheal-api.onrender.com/get-mood-suggestions/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ mood: selectedMood }),
        });

        const data = await response.json();
        if (data.suggestions && Array.isArray(data.suggestions)) {
          setSuggestion(data.suggestions);
          navigation.replace('MoodResult', { selectedMood, suggestions: data.suggestions });
        } else {
          throw new Error('Invalid response structure');
        }
      } catch (error) {
        console.error('Error fetching suggestion:', error);
        setError('There was an issue processing your request.');
        setIsLoading(false);
      }
    };

    fetchSuggestion();
  }, [selectedMood, navigation]);

  if (isloading) {
    return (
      <RootLayout screenName={'Mood'} navigation={navigation} userType={userType}>
        <View style={styles.container}>
            <ActivityIndicator size="large" color={Colors.purple} />
            <Text style={styles.text}>Processing your mood...</Text>
        </View>
      </RootLayout>
    );
  }

  if (error) {
    return (
      <RootLayout screenName="Matching" navigation={navigation} userType={userType}>
        <View style={styles.container}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      </RootLayout>
    );
  }

  return null; 
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.white,
  },
  text: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  errorText: {
    color: 'red',
    fontSize: 16,
    textAlign: 'center',
  },
});
