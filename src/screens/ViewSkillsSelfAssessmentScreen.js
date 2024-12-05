
import React, { useContext, useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { RootLayout } from '../navigation/RootLayout';
import { Colors, firestore, auth } from '../config';
import { AuthenticatedUserContext } from '../providers';
import { doc, getDoc } from 'firebase/firestore';

export const ViewSkillsSelfAssessmentScreen = ({ navigation }) => {
 const { userType } = useContext(AuthenticatedUserContext);
const [profileData, setProfileData] = useState(null);
    const fetchProfileData = async () => {
        const userId = auth.currentUser.uid;
        const userRef = doc(firestore, 'professionals', userId);
    
        try {
          const docSnap = await getDoc(userRef);
          if(docSnap.exists()) {
            console.log('Profile Data Fetched Successfully: ', docSnap.data());
            setProfileData(docSnap.data());
          } else{
            console.log('No such document!');
          }
        } catch(error){
          console.log('Error fetching profile data:', error.message)
        }
      };
    
      useEffect(() => {
        fetchProfileData();
      }, []);

    const handleNextPress = async () => {
        const currentUser = auth.currentUser;
        if (!currentUser) return;
    
        const userId = currentUser.uid;
        const preferences = await fetchUserPreferences(userId);
    
        if (preferences.exists) {
          Alert.alert(
            "Preferences Found",
            "You have existing preferences. Would you like to update them?",
            [
              {
                text: "Yes",
                onPress: () => navigation.navigate("Preferences")
              },
              {
                text: "No",
                onPress: () => navigation.navigate("SelfAssessment2")
              }
            ]
          );
        } else {
          navigation.navigate("Preferences");
        }
      };
    
      const handleLogsPress = () => {
        navigation.navigate('SelfAssessmentLogs');
      };

    return (
        <RootLayout screenName={'ViewSkillsSelfAssessment'} navigation={navigation}  userType={userType}>
            
            <View style={styles.container}>
        {/* Top Right Logs Button */}
        <TouchableOpacity style={styles.logsButton} onPress={handleLogsPress}>
          <Ionicons name="time-outline" size={32} color={Colors.black} />
        </TouchableOpacity>

        {/* Top Left Greeting */}
        <Text style={styles.title}>Self Assessment</Text>
        
        {/* Centered Subtext */}
        <View style={styles.middleContainer}>
          <Text style={styles.subText}>
          Welcome <Text>{profileData?.username}</Text>! Thank you for taking the time for your self-assessment! This essential step is designed to help us understand your skills and strengths, ensuring we can better match you with mental health seekers who need your expertise. Your participation plays a vital role in delivering personalized care and support.
          </Text>
        </View>
        
        {/* Bottom Text and Button */}
        <View style={styles.bottomContainer}>
         
          <TouchableOpacity 
            style={styles.button} 
            onPress={() => navigation.navigate("ProfSelfAssessment2")}
          >
            <Text style={styles.buttonText}>Next</Text>
          </TouchableOpacity>
        </View>
      </View>
            
        </RootLayout>
    );
};


const styles = StyleSheet.create({
    name:{
      fontSize: 20,
      fontWeight: 'bold',
    },
    container: {
      flex: 1,
      padding: 20,
      justifyContent: 'space-between',  
    },
    logsButton: {
      position: 'absolute',
      top: 20,
      right: 20,
      padding: 10,
      zIndex: 1,
    },
    title: {
      fontSize: 35,  
      fontWeight: 'bold',
      textAlign: 'left',
    },
    middleContainer: {
      justifyContent: 'center',  
      alignItems: 'center',      
      flex: 1,                   
    },
    subText: {
      fontSize: 20,
      textAlign: 'center',  
      marginHorizontal: 20, 
    },
    bottomContainer: {
      alignItems: 'center', 
    },
    bottomText: {
      fontSize: 15,
      color: Colors.grey,
      fontStyle: 'italic',
      marginBottom: 55,  
    },
    button: {
      backgroundColor: Colors.purple,  
      paddingVertical: 15,
      paddingHorizontal: 100,
      borderRadius: 30,
    },
    buttonText: {
      color: Colors.white,
      fontSize: 16,
      fontWeight: 'bold',
    },
  });
  