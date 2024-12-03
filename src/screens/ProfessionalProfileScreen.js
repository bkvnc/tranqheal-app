import React, { useState, useContext } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Alert, ScrollView } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { RootLayout } from '../navigation/RootLayout';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { LoadingIndicator } from '../components';
import { auth, firestore, storage } from '../config';
import { AuthenticatedUserContext } from '../providers';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

export const ProfessionalProfileScreen = () => {
  const { userType } = useContext(AuthenticatedUserContext);
  const navigation = useNavigation();
  const [profileData, setProfileData] = useState(null);
  const [ isLoading, setIsLoading ] = useState(true);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission denied', 'Sorry, we need camera roll permissions to make this work!');
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,     
    });

    if (!result.canceled) {
      const selectedImage = result.assets[0].uri;

      const response = await fetch(selectedImage);
      const blob = await response.blob();
      const userId = auth.currentUser.uid;
      const imageRef = ref(storage, `profileImages/${userId}/profilePicure.jpg`);

      await uploadBytes(imageRef, blob);
      const downloadURL = await getDownloadURL(imageRef);

      const userRef = doc(firestore, 'professionals', userId);
      await updateDoc(userRef, {
        profileImage: downloadURL
      });

      setProfileData((prevData) => ({
        ...prevData,
        profileImage: downloadURL,
      }));
    }
  };

  const fetchProfileData = async () => {
    const userId = auth.currentUser.uid;
    const userRef = doc(firestore, 'professionals', userId);

    try {
      const docSnap = await getDoc(userRef);
      if (docSnap.exists()) {
        setProfileData(docSnap.data());
        setIsLoading(false);
      } else {
        console.log('No such document!');
        setIsLoading(false);
      }
    } catch (error) {
      console.log('Error fetching profile data:', error.message);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      fetchProfileData();
    }, [])
  );

  if (isLoading) {
    return <LoadingIndicator />;
  }

  return (
    <RootLayout screenName="ProfessionalProfile" navigation={navigation} userType={userType}>
      <ScrollView>
        <View style={styles.container}>
          <View style={styles.header}>
            <View style={styles.textContainer}>
              <Text style={styles.ProfileTitle}>Profile</Text>
            </View>
          </View>

          <View style={styles.divider} />

          {/* Profile Image with Camera Icon */}
          <View style={styles.imageContainer}>
            <Image
              source={ {uri: profileData?.profileImage} || require('../assets/testprofile.jpg')} 
              style={styles.profileImage}
            />
            <TouchableOpacity style={styles.cameraIcon} onPress={pickImage}>
              <Ionicons name="camera-outline" size={24} color="white" />
            </TouchableOpacity>
          </View>

          {/* Specialty and Rating */}
          <View style={styles.additionalInfo}>
            <Text style={styles.ratingText}>
              Rating: {profileData ? `${profileData.rating || 'N/A'} / 5` : 'Loading...'}
            </Text>
          </View>

          <View style={styles.usernameContainer}>
            <Text style={styles.username}>
              Username: {profileData ? profileData.username : 'Loading...'}
            </Text>
            <TouchableOpacity
              style={styles.editButton}
              onPress={() => navigation.navigate('EditProfessionalProfile')}
            >
              <Ionicons name="pencil-outline" size={20} color="black" />
            </TouchableOpacity>
          </View>

          {/* Personal Details */}
          <View style={styles.divider} />
          <View style={styles.personalDetails}>
            <Text style={styles.detailTitle}>
              Full Name: {profileData 
                ? `${profileData.firstName || ''} ${profileData.middleName || ''} ${profileData.lastName || ''}`.trim() || 'N/A'
                : 'Loading...'}
            </Text>
            <Text style={styles.detailTitle}>Age: {profileData ? profileData.age || 'N/A' : 'Loading...'}</Text>
            <Text style={styles.detailTitle}>Gender: {profileData ? profileData.gender || 'N/A' : 'Loading...'}</Text>
            <Text style={styles.detailTitle}>Contact: {profileData ? profileData.mobileNumber || 'N/A' : 'Loading...'}</Text>
          </View>

          <View style={styles.divider} />

          {/* Contact Details */}
          <View style={styles.contactDetails}>
            <Text style={styles.detailTitle}>Mobile: {profileData ? profileData.mobileNumber || 'N/A' : 'Loading...'}</Text>
            <Text style={styles.detailTitle}>Email: {profileData ? profileData.email || 'N/A' : 'Loading...'}</Text>
            <Text style={styles.detailTitle}>Facebook: {profileData ? profileData.facebookLink || 'N/A' : 'Loading...'}</Text>
          </View>
        </View>
      </ScrollView>
    </RootLayout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: 'white',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  textContainer: {
    flex: 1,
    marginRight: 10,
  },
  ProfileTitle: {
    fontSize: 40,
    fontWeight: 'bold',
  },
  divider: {
    height: 1,
    backgroundColor: '#ddd',
    marginVertical: 15,
  },
  imageContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  profileImage: {
    width: 165,
    height: 165,
    borderRadius: 100,
  },
  cameraIcon: {
    position: 'absolute',
    bottom: 10,
    backgroundColor: '#000',
    borderRadius: 15,
    padding: 8,
    zIndex: 1,
    elevation: 5,
  },
  usernameContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
    position: 'relative',
  },
  username: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  editButton: {
    position: 'absolute',
    right: 2,
    backgroundColor: '#ECE6F0',
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 2,
  },
  additionalInfo: {
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  specialtyText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  ratingText: {
    fontSize: 16,
    color: 'gray',
  },
  personalDetails: {
    marginTop: 20,
  },
  contactDetails: {
    marginTop: 10,
  },
  detailTitle: {
    fontSize: 18,
    color: '#333',
    marginBottom: 10,
  },
});

export default ProfessionalProfileScreen;
