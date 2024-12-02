import React, { useEffect, useState, useContext } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { RootLayout } from '../navigation/RootLayout';
import { AuthenticatedUserContext } from '../providers';
import { Colors, firestore, auth } from '../config';
import { collection, updateDoc, doc, query, where, orderBy, limit, getDocs } from 'firebase/firestore';

export const MoodProcessScreen = ({ route, navigation }) => {
  const { selectedMood } = route.params;
  const { userType } = useContext(AuthenticatedUserContext);
  const [isloading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSuggestion = async () => {
      try {
        const response = await fetch('https://tranqheal-api.onrender.com/get-mood-suggestions/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ mood: selectedMood }),
        });

        const data = await response.json();
        console.log('Response:', data);

        if (data.suggestion) {
          const user = auth.currentUser;
          if (user) {
            const userId = user.uid;
            const userRef = doc(firestore, 'users', userId);
            const moodTrackRef = collection(userRef, 'moodTrackings');

            const moodTrackQuery = query(
              moodTrackRef,
              orderBy('createdAt', 'desc'), 
              limit(1) 
            );
            const querySnapshot = await getDocs(moodTrackQuery);
            const latestDoc = querySnapshot.docs[0];

            const moodTrackDocRef = doc(firestore, 'users', userId, 'moodTrackings', latestDoc.id);
            await updateDoc(moodTrackDocRef, {
              suggestion: data.suggestion
            });
            console.log('Suggestion added in firestore successfully');
          } else {
            console.log('User is not authenticated');
            throw new Error('User is not authenticated');
          }
          navigation.replace('MoodResult', { selectedMood, suggestion: data.suggestion });
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
