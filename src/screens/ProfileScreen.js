import React, { useState, useContext } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Alert } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { RootLayout } from '../navigation/RootLayout';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { LoadingIndicator } from '../components';
import { auth, firestore, storage } from '../config';
import { AuthenticatedUserContext } from '../providers';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { ScrollView } from 'react-native-gesture-handler';


export const ProfileScreen = () => {
  const { userType } = useContext(AuthenticatedUserContext);
  const navigation = useNavigation();
  const [profileData, setProfileData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

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

      const userRef = doc(firestore, 'users', userId);
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
    setIsLoading(true);
    const userId = auth.currentUser.uid;
    const userRef = doc(firestore, 'users', userId);

    try {
      const docSnap = await getDoc(userRef);
      if(docSnap.exists()) {
        setProfileData(docSnap.data());
      } else{
        console.log('No such document!');
      }
    } catch(error){
      console.log('Error fetching profile data:', error.message)
    } finally {
      setIsLoading(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      fetchProfileData();
    }, [])
  );

  if (isLoading) {
    return <LoadingIndicator />
  }

  return (
    <RootLayout screenName="Profile" navigation={navigation} userType={userType}>
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
                source={{ uri: profileData?.profileImage } || require('../assets/testprofile.jpg')}
                style={styles.profileImage}
              />
              <TouchableOpacity style={styles.cameraIcon} onPress={pickImage}>
                <Ionicons name="camera-outline" size={24} color="white" />
              </TouchableOpacity>
            </View>

            {/* Username with Hovering Edit Icon */}
            <View style={styles.card}>
              <View style={styles.usernameContainer}>
                <Text style={styles.detailsTitle}>Username</Text>
                <Text style={styles.detailsText}>{profileData?.username || 'N/A'}</Text>
                <TouchableOpacity
                  style={styles.editButton}
                  onPress={() => navigation.navigate('EditProfile', { profileData })}
                >
                  <Ionicons name="pencil-outline" size={20} color="black" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Personal Details */}
            <View style={styles.card}>
              <Text style={styles.detailsTitle}>Full Name</Text>
              <Text style={styles.detailsText}>
                {`${profileData?.firstName || ''} ${profileData?.middleName || ''} ${profileData?.lastName || ''}`.trim() || 'N/A'}
              </Text>
              <Text style={styles.detailsTitle}>Age</Text>
              <Text style={styles.detailsText}>{profileData?.age || 'N/A'}</Text>
              <Text style={styles.detailsTitle}>Gender</Text>
              <Text style={styles.detailsText}>{profileData?.gender || 'N/A'}</Text>
              <Text style={styles.detailsTitle}>Contact</Text>
              <Text style={styles.detailsText}>{profileData?.mobileNumber || 'N/A'}</Text>
            </View>

            {/* Specialization */}
            <View style={styles.card}>
              
            </View>

            {/* Availability */}
            <View style={styles.card}>
              
            </View>

            {/* Contact Details */}
            <View style={styles.card}>
              <Text style={styles.detailsTitle}>Mobile</Text>
              <Text style={styles.detailsText}>{profileData?.mobileNumber || 'N/A'}</Text>
              <Text style={styles.detailsTitle}>Email</Text>
              <Text style={styles.detailsText}>{profileData?.email || 'N/A'}</Text>
              <Text style={styles.detailsTitle}>Facebook</Text>
              <Text style={styles.detailsText}>{profileData?.facebookLink || 'N/A'}</Text>
            </View>
          </View>
        </ScrollView>
 
    </RootLayout>  
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingVertical: 30,
    backgroundColor: 'white', 
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
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
    marginBottom: 20,
  },
  profileImage: {
    width: 165,
    height: 165,
    borderRadius: 100,
    borderWidth: 2,
    borderColor: '#d1d1d1',
    backgroundColor: '#f8f8f8',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
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
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff', 
  },
  
  usernameContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 10,
    position: 'relative',
  },
  username: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  editButton: {
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
  card: {
    backgroundColor: '#ffffff',
    padding: 15,
    marginVertical: 10,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#eaeaea',
    width: '90%',
    alignSelf: 'center',
  },
  detailsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  detailsText: {
    fontSize: 16,
    color: '#555',
    lineHeight: 22,
    marginBottom: 10,
  },
  personalDetails: {
    marginVertical: 10,
  },
  contactDetails: {
    marginVertical: 10,
  },
});

