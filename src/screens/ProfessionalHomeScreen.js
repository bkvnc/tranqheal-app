import React, { useState, useEffect, useContext } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { RootLayout } from '../navigation/RootLayout';
import { doc, getDoc } from 'firebase/firestore';
import { auth, firestore } from '../config';
import { AuthenticatedUserContext } from '../providers';  

export const ProfessionalHomeScreen = ({ navigation }) => {
  const { userType } = useContext(AuthenticatedUserContext);
  const [profileData, setProfileData] = useState(null);
  const [refreshing, setRefreshing] = useState(false);  

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

  

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchProfileData();
    setRefreshing(false);
  };

  useEffect(() => {
    fetchProfileData();
  }, []);

  return (
    <RootLayout navigation={navigation} screenName={'ProfessionalHome'} userType={userType}>
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={{ flex: 1, padding: 20 }}>
          {/* Header Section */}
          <View style={styles.header}>
            {/* Greeting and Subtext */}
            <View style={styles.textContainer}>
              <Text style={styles.greeting}>Hello, {profileData?.username}!</Text>
              <Text style={styles.subText}>Assess, Connect, Thrive: Your Path to Mental Wellness</Text>
            </View>
            {/* Profile Picture */}
            <Image
              source={ {uri: profileData?.profileImage} || require('../assets/testprofile.jpg')}
              style={styles.profileImage}
            />
          </View>
        </View>

        {/* To-Do List Buttons */}
        
        <View style={{ marginTop: 40 }}>


          
       
        {!profileData?.selfAssessmentStatus  && (
    <TouchableOpacity
      onPress={() => navigation.navigate('ViewProfSelfAssessment')}
      style={styles.todoItem}
    >
      <View style={styles.circle}>
        <Ionicons name="clipboard-outline" size={24} color="white" />
      </View>
      <Text style={styles.todoText}>Take Skills Self Assessment</Text>
      <Image
        source={require('../assets/selfassessmentpic.jpg')}
        style={styles.todoImage}
      />
    </TouchableOpacity>
  )}


        

          <TouchableOpacity onPress={() => navigation.navigate('ViewOrganizations')} style={styles.todoItem}>
            <View style={styles.circle}>
              <Ionicons name="clipboard-outline" size={24} color="white" />
            </View>
            <Text style={styles.todoText}>View Organizations</Text>

            <Image source={require('../assets/orgspic.jpg')} style={styles.todoImage} />
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.navigate('ForumMain')} style={styles.todoItem}>
            <View style={styles.circle}>
              <Ionicons name="chatbox-outline" size={24} color="white" />
            </View>
            <Text style={styles.todoText}>Forums</Text>
            <Image source={require('../assets/forumspic.png')} style={styles.todoImage} />
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.navigate('ViewRequestHistory')} style={styles.todoItem}>
            <View style={styles.circle}>
              <Ionicons name="person-circle-outline" size={24} color="white" />
            </View>
            <Text style={styles.todoText}>View Request History</Text>
            <Image source={require('../assets/viewrequesthistory.jpg')} style={styles.todoImage} />
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.navigate('ViewRequest')} style={styles.todoItem}>
            <View style={styles.circle}>
              <Ionicons name="business-outline" size={24} color="white" />
            </View>
            <Text style={styles.todoText}>View Request</Text>
            <Image source={require('../assets/professionalspic.jpg')} style={styles.todoImage} />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </RootLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  textContainer: {
    flex: 1,
    marginRight: 10,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  subText: {
    fontSize: 16,
    color: '#6c757d',
    marginTop: 5,
    flexShrink: 1,
  },
  profileImage: {
    width: 165,
    height: 165,
    borderRadius: 40,
  },
  todoContainer: {
    flex: 1,
    marginTop: 20,
  },
  todoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 10,
    marginLeft: 16,
    padding: 8,
    backgroundColor: '#F7F2FA',
    borderRadius: 12,
    width: 360,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  todoText: {
    marginLeft: 15,
    fontSize: 16,
  },
  circle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#65558F',
    justifyContent: 'center',
    alignItems: 'center',
  },
  todoImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginLeft: 'auto',
  },
});
