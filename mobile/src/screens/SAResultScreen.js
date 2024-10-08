import React, { useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView } from 'react-native';
import { RootLayout } from '../navigation/RootLayout';
import { Colors } from '../config';
import { AuthenticatedUserContext } from '../../shared/providers';
import { getFirestore, doc, addDoc, collection } from 'firebase/firestore';
import { auth, firestore } from '../../shared/config';

export const SAResultScreen = ({ navigation, route }) =>{
  const { userType } = useContext(AuthenticatedUserContext);
  const { gad7Total, phq9Total, pssTotal } = route.params;

  const interpretPHQ9 = (score) => {
    if (score <= 4) return 'Minimal or no depression';
    if (score <= 9) return 'Mild depression';
    if (score <= 14) return 'Moderate depression';
    if (score <= 19) return 'Moderately severe depression';
    return 'Severe depression';
  };

  const interpretGAD7 = (score) => {
    if (score <= 4) return 'Minimal or no anxiety';
    if (score <= 9) return 'Mild anxiety';
    if (score <= 14) return 'Moderate anxiety';
    return 'Severe anxiety';
  };

  const interpretPSS = (score) => {
    if (score <= 13) return 'Low stress';
    if (score <= 26) return 'Moderate stress';
    return 'Severe stress';
  };

  const handleFinish = async () => {
    const user = auth.currentUser;
    const phq9Interpretation = interpretPHQ9(phq9Total);
    const gad7Interpretation = interpretGAD7(gad7Total);
    const pssInterpretation = interpretPSS(pssTotal);

    if (user) {
      try {
        const userId = user.uid;

        const userAssessmentRef = doc(firestore, 'users', userId);
        const selfAssessmentRef = collection(userAssessmentRef, 'selfAssessment');
        await addDoc(selfAssessmentRef, {
          phq9Total,
          gad7Total,
          pssTotal,
          phq9Interpretation,
          gad7Interpretation,
          pssInterpretation,
          timestamp: new Date(),
        });
        navigation.navigate('Home');
      } catch (error) {
        console.error('Error saving assessment:', error);
      }
    } else {
      console.error('User not authenticated!');
    }
  };

  return (
    <RootLayout screenName="SAResult" navigation={navigation} userType={userType}>
       <ScrollView style={styles.container}>
      {/* Title */}
      <Text style={styles.title}>Your total score was ..... </Text>

      {/* Scores Section */}
      <View style={styles.scoreSection}>
        <Text style={styles.scoreText}>{phq9Total} in PHQ-9 (Depression Test)</Text>
        <Text style={styles.resultText}>Your result suggests that you may have {interpretPHQ9(phq9Total)}</Text>

        <Text style={styles.scoreText}>{gad7Total} in GAD-7 (Anxiety Screening Test)</Text>
        <Text style={styles.resultText}>Your result suggests that you may have {interpretGAD7(gad7Total)}</Text>

        <Text style={styles.scoreText}>{pssTotal} in PSS (Stress Test)</Text>
        <Text style={styles.resultText}>Your result suggests that you may have {interpretPSS(pssTotal)}</Text>
      </View>

      {/* Disclaimer Section */}
      <Text style={styles.disclaimer}>
        Disclaimer: The scores on the following self-assessment do 
        <Text style={{ color: 'red', fontWeight: 'bold' }}> NOT </Text> 
        reflect any particular diagnosis or course of treatment. They are meant as a tool to help assess your current mental well-being. 
        If you have any further concerns about your current well-being, please seek a professional.
      </Text>

      {/* Action Buttons */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('SeekProfessionalScreen')}>
          <Text style={styles.buttonText}>Seek Professional</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={handleFinish}>
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
