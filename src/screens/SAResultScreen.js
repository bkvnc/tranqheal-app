import React, { useContext, useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { RootLayout } from '../navigation/RootLayout';
import { Colors } from '../config';
import { AuthenticatedUserContext } from '../providers';
import { getFirestore, collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { auth } from '../config';

export const SAResultScreen = ({ navigation }) => {
  const { userType } = useContext(AuthenticatedUserContext);
  const [assessmentData, setAssessmentData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAssessmentData = async () => {
      const user = auth.currentUser;
      if (user) {
        try {
          const userId = user.uid;
          const assessmentsRef = collection(getFirestore(), 'users', userId, 'selfAssessment');
          const q = query(assessmentsRef, orderBy('createdAt', 'desc'), limit(1)); // Assuming you have a 'createdAt' field to determine the latest assessment
          const querySnapshot = await getDocs(q);
    
          if (!querySnapshot.empty) {
            const docSnap = querySnapshot.docs[0];
            setAssessmentData(docSnap.data());
          } else {
            console.error('No assessments found!');
          }
        } catch (error) {
          console.error('Error fetching assessment data:', error);
        } finally {
          setLoading(false);
        }
      } else {
        console.error('User not authenticated!');
        setLoading(false);
      }
    };

    fetchAssessmentData();
  }, []);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.purple} />
        <Text style={styles.loadingText}>Loading your assessment...</Text>
      </View>
    );
  }

  return (
    <RootLayout screenName="SAResult" navigation={navigation} userType={userType}>
      <ScrollView style={styles.container}>
        {/* Title */}
        <Text style={styles.title}>Your total score was ..... </Text>

        {/* Scores Section */}
        <View style={styles.scoreSection}>
          <Text style={styles.scoreText}>{assessmentData.phq9Total} in PHQ-9 (Depression Test)</Text>
          <Text style={styles.resultText}>Your result suggests that you may have {assessmentData.phq9Interpretation}</Text>

          <Text style={styles.scoreText}>{assessmentData.gad7Total} in GAD-7 (Anxiety Screening Test)</Text>
          <Text style={styles.resultText}>Your result suggests that you may have {assessmentData.gad7Interpretation}</Text>

          <Text style={styles.scoreText}>{assessmentData.pssTotal} in PSS (Stress Test)</Text>
          <Text style={styles.resultText}>Your result suggests that you may have {assessmentData.pssInterpretation}</Text>
        </View>

        {/* Disclaimer Section */}
        <Text style={styles.disclaimer}>
          Disclaimer: The scores on the following self-assessment do 
          <Text style={{ color: 'red', fontWeight: 'bold' }}> NOT </Text> 
          reflect any particular diagnosis or course of treatment. They are meant as a tool to help assess your current mental well-being. 
          If you have any further concerns about your current well-being, please seek your doctor or a professional.
        </Text>

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('SeekProfessional')}>
            <Text style={styles.buttonText}>Seek Professional</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('Home')}>
            <Text style={styles.buttonText}>Finish</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </RootLayout>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: Colors.purple,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 30,
  },
  scoreSection: {
    marginBottom: 20,
  },
  scoreText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  resultText: {
    fontSize: 16,
    marginBottom: 15,
  },
  disclaimer: {
    fontSize: 12,
    textAlign: 'center',
    marginVertical: 20,
  },
  buttonContainer: {
    marginTop: 20,
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  button: {
    backgroundColor: Colors.purple,
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 25,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 5,
    marginBottom: 20,
  },
  buttonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
});
