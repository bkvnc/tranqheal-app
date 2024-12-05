import React, { useState, useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import RadioGroup from 'react-native-radio-buttons-group';
import { RootLayout } from '../navigation/RootLayout';
import { Colors } from '../config';
import { AuthenticatedUserContext } from '../providers';
import { profassessmentQuestions } from 'src/utils/profassessmentQuestions';
import { profassessmentStates } from 'src/utils/profassessmentStates';
import { getFirestore, collection,setDoc } from 'firebase/firestore';

export const ProfSAScreen2 = ({ navigation }) => {
  const { userType } = useContext(AuthenticatedUserContext);
  const [answers, setAnswers] = useState(profassessmentStates.FirstSet);
  const radioOptions = profassessmentStates.firstRadioOptions;

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

  const handleFinish = async () => {
    const unansweredQuestions = Object.keys(answers).filter((key) => answers[key] === null);

    if (unansweredQuestions.length > 0) {
      Alert.alert('Incomplete Assessment', 'Please answer all questions.');
      return;
    }

    const user = auth.currentUser;
    const pssTotal = calculatePSSTotalScore();
    // const phq9Interpretation = interpretPHQ9(phq9Total);
    // const gad7Interpretation = interpretGAD7(gad7Total);
    // const pssInterpretation = interpretPSS(pssTotal);

    if (user) {
      try {
        const userId = user.uid;

        const userAssessmentRef = doc(firestore, 'professionals', userId);
      
        await addDoc(userAssessmentRef, {
        //   phq9Total,
        //   gad7Total,
        //   pssTotal,
        //   phq9Interpretation,
        //   gad7Interpretation,
        //   pssInterpretation,
        //   createdAt: new Date(),
        selfAssessmentStatus : 'completed',
        });

        navigation.navigate('professionalHome');
      } catch (error) {
        console.error('Error saving assessment:', error);
      }
    } else {
      console.error('User not authenticated!');
    }
  };

  return (
    <RootLayout screenName="ProfSelfAssessment" navigation={navigation} userType={userType}>
      <ScrollView style={styles.container}>

        {/* Title */}
        <Text style={styles.title}>Self-Assessment</Text>
        <Text style={styles.introText}>
          Please answer the following questions.
        </Text>

        {/* Questions */}
        <Text style={styles.sectionTitle}>Exploration Skills:</Text>

        {profassessmentQuestions.Exploration.map((question) => (
          <View style={styles.inputSection} key={question.key}>
            <Text style={styles.label}>{question.label}</Text>
            <View style={styles.radioGroup}>
              <RadioGroup
                radioButtons={radioOptions}
                onPress={(selectedId) => handleSelectOption(question.key, selectedId)}
                selectedId={answers[question.key]}
                containerStyle={styles.radioGroupContainer}
              />
            </View>
          </View>
        ))}
        <Text style={styles.sectionTitle}>Insight-Building Skills:</Text>
        {profassessmentQuestions.InsightBuilding.map((question) => (
          <View style={styles.inputSection} key={question.key}>
            <Text style={styles.label}>{question.label}</Text>
            <View style={styles.radioGroup}>
              <RadioGroup
                radioButtons={radioOptions}
                onPress={(selectedId) => handleSelectOption(question.key, selectedId)}
                selectedId={answers[question.key]}
                containerStyle={styles.radioGroupContainer}
              />
            </View>
          </View>
        ))}
        <Text style={styles.sectionTitle}>Action Strategies:</Text>
        {profassessmentQuestions.ActionStrategies.map((question) => (
          <View style={styles.inputSection} key={question.key}>
            <Text style={styles.label}>{question.label}</Text>
            <View style={styles.radioGroup}>
              <RadioGroup
                radioButtons={radioOptions}
                onPress={(selectedId) => handleSelectOption(question.key, selectedId)}
                selectedId={answers[question.key]}
                containerStyle={styles.radioGroupContainer}
              />
            </View>
          </View>
        ))}
        <Text style={styles.sectionTitle}>Therapeutic Alliance:</Text>
        {profassessmentQuestions.TherapeuticAlliance.map((question) => (
          <View style={styles.inputSection} key={question.key}>
            <Text style={styles.label}>{question.label}</Text>
            <View style={styles.radioGroup}>
              <RadioGroup
                radioButtons={radioOptions}
                onPress={(selectedId) => handleSelectOption(question.key, selectedId)}
                selectedId={answers[question.key]}
                containerStyle={styles.radioGroupContainer}
              />
            </View>
          </View>
        ))}
        <Text style={styles.sectionTitle}>Case Formulation and Clinical Management:</Text>
        {profassessmentQuestions.CaseFormulation.map((question) => (
          <View style={styles.inputSection} key={question.key}>
            <Text style={styles.label}>{question.label}</Text>
            <View style={styles.radioGroup}>
              <RadioGroup
                radioButtons={radioOptions}
                onPress={(selectedId) => handleSelectOption(question.key, selectedId)}
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
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  introText: {
    fontSize: 16,
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
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
    color: Colors.text,
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
  sectionTitle:{
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
    textAlign: 'justify',
    
  },
  buttonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
});
