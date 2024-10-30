import React, { useState, useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView } from 'react-native';
import RadioGroup from 'react-native-radio-buttons-group';   //https://www.npmjs.com/package/react-native-radio-buttons-group
import { RootLayout } from '../navigation/RootLayout';
import { Colors } from '../config';
import { AuthenticatedUserContext } from '../providers';
import { getFirestore, doc, addDoc, collection } from 'firebase/firestore';
import { auth, firestore } from '../config';

export const SAScreen3 = ({navigation, route}) => {
  const { userType } = useContext(AuthenticatedUserContext);
  const { gad7Total, phq9Total } = route.params;

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

  // State for each question's answer
  const [answers, setAnswers] = useState({
    upsetUnexpectedly: null, 
    unableControlThings: null,
    nervousAndStressed: null,
    handlePersonalProblems: null,
    thingsGoingYourWay: null,
    unableToCope: null,
    controlIrritations: null,
    onTopOfThings: null,
    angeredByThings: null,
    pilingUpDifficulties: null,
  });

  const handleSelectOption = (key, selectedId) => {
    setAnswers((prevAnswers) => ({ ...prevAnswers, [key]: selectedId }));
  };

  const calculatePSSTotalScore = () => {
    const pssKeys = [
      'upsetUnexpectedly',
      'unableControlThings',
      'nervousAndStressed',
      'handlePersonalProblems', //reverse
      'thingsGoingYourWay', //reverse
      'unableToCope',
      'controlIrritations', //reverse
      'onTopOfThings', //reverse
      'angeredByThings',
      'pilingUpDifficulties',
    ];
    //Questions that need to be reversed
    const reversedKeys = [
      'handlePersonalProblems', 
      'thingsGoingYourWay', 
      'controlIrritations', 
      'onTopOfThings'
    ];
    //Reversing the score
    const reverseScore = (value) => {
      switch (parseInt(value)) {
        case 0: return 4;
        case 1: return 3;
        case 2: return 2;
        case 3: return 1;
        case 4: return 0;
        default: return 0;
      }
    }

    const idToValue = {
      '1': '0',
      '2': '1',
      '3': '2',
      '4': '3',
      '5': '4',
    };
    //Calculate the total score
    return pssKeys.reduce((total, key) => {
      const selectedId = answers[key];
      const answerValue = idToValue[selectedId] || '0';
      const score = reversedKeys.includes(key) ? reverseScore(answerValue) : parseInt(answerValue);
      console.log(`key: ${key}, answer: ${answerValue}, score: ${score}`);
      return total + score;
    }, 0); //Initialize total to 0
  };

  const handleFinish = async () => {
    const user = auth.currentUser;
    const pssTotal = calculatePSSTotalScore();
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
          createdAt: new Date(),
        });
        navigation.navigate('SelfAssessmentResult');
      } catch (error) {
        console.error('Error saving assessment:', error);
      }
    } else {
      console.error('User not authenticated!');
    }
  };

  const radioOptions = [
    { id: '1', label: 'Never', value: '0' },
    { id: '2', label: 'Almost never', value: '1' },
    { id: '3', label: 'Sometimes', value: '2' },
    { id: '4', label: 'Fairly often', value: '3' },
    { id: '5', label: 'Very often', value: '4' },
  ];

  return (
    <RootLayout screenName={'SelfAssessment3'} navigation={navigation} userType={userType}>
      <ScrollView style={styles.container}>
     
      {/* Title */}
      
      <Text style={styles.introText}>
        In the last month, how often..
      </Text>

      {/* Questions with Never options */}
      {[
        { label: 'How often have you been upset because of something that happened unexpectedly?', key: 'upsetUnexpectedly' },
        { label: 'Have you felt that you were unable to control the important things in your life?', key: 'unableControlThings' },
        { label: 'Have you felt nervous and stressed?', key: 'nervousAndStressed' },
        { label: 'Have you felt confident about your ability to handle your personal problems?', key: 'handlePersonalProblems' },
        { label: 'Have you felt that things were going your way?', key: 'thingsGoingYourWay' },
        { label: 'Have you found that you could not cope with all the things you had to do?', key: 'unableToCope' },
        { label: 'Have you been able to control irritations in your life?', key: 'controlIrritations' },
        { label: 'Have you felt that you were on top of things?', key: 'onTopOfThings' },
        { label: 'Have you been angered because of things that happened that were outside of your control?', key: 'angeredByThings' },
        { label: 'Have you felt difficulties were piling up so high that you could not overcome them?', key: 'pilingUpDifficulties' },
      ].map((question) => (
        <View style={styles.inputSection} key={question.key}>
          <Text style={styles.label}>{question.label}</Text>
          <View style={styles.radioGroup}>
            <RadioGroup
              radioButtons={radioOptions}
              onPress={(selectedId) => {
                console.log('button:', selectedId);
                handleSelectOption(question.key, selectedId);
              }}
              selectedId={answers[question.key]}
              containerStyle={styles.radioGroupContainer}
            />
          </View>
        </View>
      ))}

      {/* Next Button */}
      <TouchableOpacity style={styles.button} onPress={handleFinish}>
        <Text style={styles.buttonText}>Finish</Text>
      </TouchableOpacity>
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
  introText: {
    fontSize: 20,
    textAlign: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 30,
  },
  inputSection: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  radioGroup: {
    alignItems: 'flex-start',
  },
  radioGroupContainer: {
    width: '100%', 
    alignItems: 'flex-start', 
  },
  button: {
    backgroundColor: Colors.purple,
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 25,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 20,
  },
  buttonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
});
