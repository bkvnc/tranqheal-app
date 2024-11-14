import React, { useState, useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import RadioGroup from 'react-native-radio-buttons-group';
import { RootLayout } from '../navigation/RootLayout';
import { Colors } from '../config';
import { AuthenticatedUserContext } from '../providers';

export const SAScreen2 = ({navigation}) => {
  const { userType } = useContext(AuthenticatedUserContext);
  // State for each question's answer
  const [answers, setAnswers] = useState({
    interest: null,
    feelingDown: null,
    sleepIssues: null,
    tiredness: null,
    appetite: null,
    feelingBad: null,
    concentration: null,
    movingSlowly: null,
    thoughts: null,
    feelingNervous: null,
    controlWorrying: null,
    tooMuchWorrying: null,
    troubleRelaxing: null,
    restlessness: null,
    irritable: null,
    afraid: null,
  });

  const radioOptions = [
    { id: '1', label: 'Not at all', value: '0' },
    { id: '2', label: 'Several days', value: '1' },
    { id: '3', label: 'More than half the days', value: '2' },
    { id: '4', label: 'Nearly every day', value: '3' },
  ];

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
        {[
          { label: 'Little interest or pleasure in doing things.', key: 'interest' },
          { label: 'Feeling down, depressed, or hopeless.', key: 'feelingDown' },
          { label: 'Trouble falling or staying asleep, or sleeping too much.', key: 'sleepIssues' },
          { label: 'Feeling tired or having little energy.', key: 'tiredness' },
          { label: 'Poor appetite or overeating.', key: 'appetite' },
          { label: 'Feeling bad about yourself... or that you are a failure or have let yourself or your family down.', key: 'feelingBad' },
          { label: 'Trouble concentrating on things, such as reading the newspaper or watching television.', key: 'concentration' },
          { label: 'Moving or speaking so slowly that other people could have noticed. Or the opposite - being so fidgety or restless that you have been moving around a lot more than usual.', key: 'movingSlowly' },
          { label: 'Thoughts that you would be better off dead, or of hurting yourself.', key: 'thoughts' },
          { label: 'Feeling nervous, anxious, or on edge.', key: 'feelingNervous' },
          { label: 'Not being able to stop or control worrying.', key: 'controlWorrying' },
          { label: 'Worrying too much about different things.', key: 'tooMuchWorrying' },
          { label: 'Trouble relaxing.', key: 'troubleRelaxing' },
          { label: 'Being so restless that it is hard to sit still.', key: 'restlessness' },
          { label: 'Being easily annoyed or irritable.', key: 'irritable' },
          { label: 'Feeling afraid, as if something awful might happen.', key: 'afraid' },
        ].map((question) => (
          <View style={styles.inputSection} key={question.key}>
            <Text style={styles.label}>{question.label}</Text>
            <View style={styles.radioGroup}>
              <RadioGroup
                radioButtons={radioOptions}
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
