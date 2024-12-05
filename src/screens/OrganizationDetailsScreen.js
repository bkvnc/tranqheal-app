import React, { useContext, useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView } from 'react-native';
import { RootLayout } from '../navigation/RootLayout';
import { AuthenticatedUserContext } from '../providers';
import { LoadingIndicator } from '../components';
import { Colors, auth, firestore } from '../config';
import { doc, getDoc } from 'firebase/firestore';
import { Ionicons } from '@expo/vector-icons';

export const OrganizationDetailsScreen = ({ navigation, route }) => {
  const { userType } = useContext(AuthenticatedUserContext);
  const [organizationData, setOrganizationData] = useState(null);
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { organization } = route.params;

  // Fetch organization details
  const fetchOrganizationDetails = async () => {
    try {
      if (!organization) {
        throw new Error('No organizationId provided.');
      }

      const organizationRef = doc(firestore, 'organizations', organization);
      const docSnap = await getDoc(organizationRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        setOrganizationData(data);
      } else {
        console.warn('No organization document found.');
      }
    } catch (error) {
      console.error('Error fetching organization details:', error.message);
    }
  };

  // Fetch professional profile data
  const fetchProfileData = async () => {
    const userId = auth.currentUser.uid;

    try {
      const userRef = doc(firestore, 'professionals', userId);
      const docSnap = await getDoc(userRef);

      if (docSnap.exists()) {
        setProfileData(docSnap.data());
      } else {
        console.warn('Professional profile document not found.');
      }
    } catch (error) {
      console.error('Error fetching professional profile data:', error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrganizationDetails();
    fetchProfileData();
  }, []);

  const handleApplyOrganization = () => {
    navigation.navigate('UploadCredentials', {
      isRegistered: true,
      organizationId: organization,
      organizationName: organizationData?.organizationName,
      userType,
      userStatus: profileData?.status,
    });
  };

  const formatBulletedList = (items, maxRows = 3) => {
    if (!Array.isArray(items) || items.length === 0) return null; 

    if (items.length <= maxRows) {
      return items.map((item, index) => (
        <Text key={index} style={styles.bulletItem}>• {item}</Text>
      ));
    }

    const visibleItems = items.slice(0, maxRows - 1);
    const lastItem = items.slice(maxRows - 1).join(', ');

    return (
      <>
        {visibleItems.map((item, index) => (
          <Text key={index} style={styles.bulletItem}>• {item}</Text>
        ))}
        <Text style={styles.bulletItem}>• {lastItem}</Text>
      </>
    );
  };

  if (loading) {
    return <LoadingIndicator />;
  }

  const {
    profilePicture,
    organizationName,
    email,
    phoneNumber,
    servicesOffered,
    timeStart,
    timeEnd,
    days = {}, 
    address,
  } = organizationData || {};
  const daysArray = Object.values(days);

  
  const convertTo12HourFormat = (time24) => {
    const [hours, minutes] = time24.split(':');
    const period = hours >= 12 ? 'PM' : 'AM';
    const hours12 = hours % 12 || 12; // Convert hours to 12-hour format
    return `${hours12}:${minutes} ${period}`;
  };
  const timeStart12 = timeStart ? convertTo12HourFormat(timeStart) : 'N/A';
  const timeEnd12 = timeEnd ? convertTo12HourFormat(timeEnd) : 'N/A';

  return (
    <RootLayout navigation={navigation} screenName="OrganizationDetails" userType={userType}>
      <ScrollView contentContainerStyle={styles.container}>
        <Image source={{ uri: profilePicture }} style={styles.orgImage} />
        <Text style={styles.orgName}>{organizationName}</Text>
        <TouchableOpacity style={styles.iconContainer} onPress={() => console.log('Facebook icon clicked')}>
            <Ionicons name="logo-facebook" size={28} color="#3b5998" />
        </TouchableOpacity>
        <View style={styles.divider} />
        <Text style={styles.detailsText}>Email: {email || 'N/A'}</Text>
        <Text style={styles.detailsText}>Phone: {phoneNumber || 'N/A'}</Text>
        <Text style={styles.detailsTitle}>Address:</Text>
        <Text style={styles.detailsText}>{address || 'N/A'}</Text>

        <View style={styles.card}>
          <Text style={styles.detailsTitle}>Services Offered:</Text>
          {formatBulletedList(servicesOffered, 3)}
        </View>

        <View style={styles.card}>
          <Text style={styles.detailsTitle}>Hours Available:</Text>
          <Text style={styles.detailsText}>
            {timeStart12 && timeEnd12 ? `${timeStart12} - ${timeEnd12}` : 'N/A'}
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.detailsTitle}>Days Available:</Text>
          {formatBulletedList(daysArray, 4)}
        </View>
        
        {userType === 'professional' && !profileData?.underOrg && (
          <TouchableOpacity style={styles.applyButton} onPress={handleApplyOrganization}>
            <Text style={styles.applyButtonText}>Apply Organization</Text>
          </TouchableOpacity>
        )}

      </ScrollView>
    </RootLayout>
  );
};


const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingVertical: 30,
  },
  orgImage: {
    width: 120, 
    height: 120,
    borderRadius: 60, 
    alignSelf: 'center',
    marginBottom: 10,
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5, 
  },
  orgName: {
    fontSize: 28, 
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#333', 
    marginBottom: 10,
  },
  divider: {
    height: 1,
    backgroundColor: '#e0e0e0', 
    marginVertical: 20,
  },
  detailsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333', 
    marginTop: 10,
    marginBottom: 5,
  },
  detailsText: {
    fontSize: 16,
    color: '#555', 
    lineHeight: 22, 
    marginBottom: 5,
  },
  bulletItem: {
    fontSize: 16,
    color: '#555',
    marginBottom: 5,
    marginLeft: 15, 
  },
  card: {
    backgroundColor: '#fff',
    padding: 15,
    marginVertical: 10,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3, 
  },
  applyButton: {
    backgroundColor: '#6A0DAD',
    paddingVertical: 15,
    paddingHorizontal: 25,
    borderRadius: 50, 
    alignItems: 'center',
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 2,
  },
  applyButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: 1, 
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

