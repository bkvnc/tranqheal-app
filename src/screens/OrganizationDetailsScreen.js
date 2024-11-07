import React, { useContext, useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { RootLayout } from '../navigation/RootLayout';
import { AuthenticatedUserContext } from '../providers';
import { Colors, auth, firestore } from '../config';
import { doc, getDoc } from 'firebase/firestore';

export const OrganizationDetailsScreen = ({ navigation, route }) => {
  const { userType } = useContext(AuthenticatedUserContext);
  const [ profileData, setProfileData ]  = useState(null);
  const { organization } = route.params;

  const fetchProfileData = async () => {
    const userId = auth.currentUser.uid;
    const userRef = doc(firestore, 'professionals', userId);

    try {
      const docSnap = await getDoc(userRef);
      if(docSnap.exists()) {
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

  const handleApplyOrganization = () => {
    navigation.navigate('UploadCredentials', {isRegistered: true, organizationId: organization.id, organizationName: organization.organizationName, userType, userStatus: profileData?.status});
  };
  
  return (
    <RootLayout navigation={navigation} screenName="OrganizationDetails" userType={userType}>
      <View style={styles.container}>
        <Image source={{ uri: organization.image }} style={styles.orgImage} />
        <Text style={styles.orgName}>{organization.organizationName}</Text>
        <Text style={styles.orgType}>Type: {organization.type}</Text>
        <Text style={styles.orgServices}>Services Offered: {organization.services}</Text>
        <Text style={styles.orgAddress}>Address: {organization.address}</Text>
        <Text style={styles.orgHours}>Hours Available: {organization.hoursAvailable}</Text>
        
        {/* Apply Organization Button */}
        <TouchableOpacity style={styles.applyButton} onPress={handleApplyOrganization}>
          <Text style={styles.applyButtonText}>Apply Organization</Text>
        </TouchableOpacity>
      </View>
    </RootLayout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: Colors.white,
  },
  orgImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignSelf: 'center',
    marginBottom: 20,
  },
  orgName: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
  },
  orgType: {
    fontSize: 18,
    color: Colors.grey,
    marginBottom: 10,
  },
  orgServices: {
    fontSize: 16,
    marginBottom: 10,
  },
  orgAddress: {
    fontSize: 16,
    marginBottom: 10,
  },
  orgHours: {
    fontSize: 16,
    marginBottom: 10,
  },
  applyButton: {
    backgroundColor: Colors.purple,
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20,
  },
  applyButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
});
