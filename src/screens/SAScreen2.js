import React, { useState, useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import RadioGroup from 'react-native-radio-buttons-group';
import { RootLayout } from '../navigation/RootLayout';
import { Colors } from '../config';
import { AuthenticatedUserContext } from '../providers';
import { assessmentQuestions } from 'src/utils/assessmentQuestions';
import { assessmentStates } from 'src/utils/assessmentStates';

export const SAScreen2 = ({navigation}) => {
  const { userType } = useContext(AuthenticatedUserContext);
  const [answers, setAnswers] = useState(assessmentStates.FirstSet);

  const handleSelectOption = (key, selectedId) => {
    setAnswers((prevAnswers) => ({ ...prevAnswers, [key]: selectedId }));
  };

  const getOptionValue = (selectedId) => {
    const selectedOption = radioOptions.find((option) => option.id === selectedId);
    return selectedOption ? parseInt(selectedOption.value, 10) : 0;
  };

  const calculateGAD7Score = () => {
    const gad7Keys = ['feelingNervous', 'controlWorrying', 'tooMuchWorrying', 'troubleRelaxing', 'restlessness', 'irritable', 'afraid'];
    return gad7Keys.reduce((total, key) => total + getOptionValue(answers[key]), 0); // Sum up the GAD-7 scores
  };

  const calculatePHQ9Score = () => {
    const phq9Keys = ['interest', 'feelingDown', 'sleepIssues', 'tiredness', 'appetite', 'feelingBad', 'concentration', 'movingSlowly', 'thoughts'];
    return phq9Keys.reduce((total, key) => total + getOptionValue(answers[key]), 0);  // Sum up the PHQ-9 scores
  };

  const handleNext = () => {
    const unansweredQuestions = Object.keys(answers).filter((key) => answers[key] === null);
    if (unansweredQuestions.length > 0) {
      Alert.alert('Incomplete Assessment', 'Please answer all questions.');
      return;
    }

    const gad7Total = calculateGAD7Score();
    const phq9Total = calculatePHQ9Score();
    navigation.navigate('SelfAssessment3', { gad7Total, phq9Total });
  };

  return (
    <RootLayout screenName={'SelfAssessment2'} navigation={navigation} userType={userType}>
      <ScrollView style={styles.container}>

        {/* Title */}
        <Text style={styles.title}>Self-Assessment</Text>
        <Text style={styles.introText}>
          Over the last two weeks, how often have you been bothered by any of the following problems?
        </Text>

        {/* Questions*/}
        {assessmentQuestions.FirstSet.map((question) => (
          <View style={styles.inputSection} key={question.key}>
            <Text style={styles.label}>{question.label}</Text>
            <View style={styles.radioGroup}>
              <RadioGroup
                radioButtons={assessmentStates.firstRadioOptions}
                onPress={(selectedId) => {
                  console.log('Selected button: ', selectedId);
                  handleSelectOption(question.key, selectedId);}}
                selectedId={answers[question.key]}
                containerStyle={styles.radioGroupContainer}
              />
            </View>
          </View>
        ))}

        {/* Next Button */}
        <TouchableOpacity style={styles.button} onPress={handleNext}>
          <Text style={styles.buttonText}>Next</Text>
        </TouchableOpacity>
      </ScrollView>
    </RootLayout>
    
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  introText: {
    fontSize: 24,
    textAlign: 'justify',
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
