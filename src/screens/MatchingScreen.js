import React, { useEffect, useState, useContext } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { RootLayout } from '../navigation/RootLayout';
import { AuthenticatedUserContext } from '../providers';
import { firestore, auth } from '../config';
import { doc, getDoc } from 'firebase/firestore'; 

export const MatchingScreen = ({ route, navigation }) => {
  const { userType } = useContext(AuthenticatedUserContext);
  const { assessmentData } = route.params;
  const [isloading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUserData = async () => {
      setIsLoading(true);
      setError(null);

      const user = auth.currentUser;
      if (!user) {
        setError('User not authenticated');
        setIsLoading(false);
        return;
      }

      try {
        const userId = user.uid;

        // Fetch main user document
        const userDoc = await getDoc(doc(firestore, 'users', userId));
        
        if (!userDoc.exists()) {
          setError('User document not found.');
          setIsLoading(false);
          return;
        }

        const userData = userDoc.data();
        // Extract preferences from user data
        const preferences = userData.preferences || null;

        // Combine assessment data and preferences
        const requestData = {
          userId: userId,
          preferences: {
            preferredProfAge: preferences.preferredProfAge,
            preferredProfGender: preferences.preferredProfGender,
            preferredProfAvailability: preferences.preferredProfAvailability,
          },
          selfAssessmentScores: {
            gad7: assessmentData.gad7Total,
            phq9: assessmentData.phq9Total,
            pss: assessmentData.pssTotal,
          },
        };

        console.log('Request Data:', JSON.stringify(requestData, null, 2));

        const response = await fetch("https://tranqheal-api.onrender.com/match-professionals/", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestData),
        });

        const data = await response.json();
        console.log('Data:', JSON.stringify(data, null, 2));
        if (response.ok) {
          navigation.navigate('SeekProfessional', { matchData: data.matches, userProfileImage: userData.profileImage });
        } else {
          navigation.navigate('SeekProfessional', { matchData: [] });
        }
      } catch (error) {
        console.error('Error fetching data or calling API:', error);
        setError('There was an issue processing your request.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, [assessmentData, navigation]);

  if (isloading) {
    return (
      <RootLayout screenName="Matching" navigation={navigation} userType={userType}>
        <View style={styles.container}>
          <ActivityIndicator size="large" color="#0000ff" />
          <Text style={styles.loadingText}>Finding the best match for you...</Text>
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

  return (
    <RootLayout screenName="Matching" navigation={navigation} userType={userType}>
      <View style={styles.container}>
        <Text>Match process completed!</Text>
      </View>
    </RootLayout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
  },
  errorText: {
    color: 'red',
    fontSize: 16,
    textAlign: 'center',
  },
});
