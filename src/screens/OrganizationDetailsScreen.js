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
      organization,
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
        <View style={styles.divider} />
        <Text style={styles.detailsText}>Email: {email || 'N/A'}</Text>
        <Text style={styles.detailsText}>Phone: {phoneNumber || 'N/A'}</Text>

        <Text style={styles.detailsTitle}>Services Offered:</Text>
        {formatBulletedList(servicesOffered, 3)}

        <Text style={styles.detailsTitle}>Hours Available:</Text>
        <Text style={styles.detailsText}>
          {timeStart12 && timeEnd12 ? `${timeStart12} - ${timeEnd12}` : 'N/A'}
        </Text>

        <Text style={styles.detailsTitle}>Days Available:</Text>
        {formatBulletedList(daysArray, 4)}

        <Text style={styles.detailsTitle}>Address:</Text>
        <Text style={styles.detailsText}>{address || 'N/A'}</Text>

        {userType === 'professional' && (
          <TouchableOpacity style={styles.applyButton} onPress={handleApplyOrganization}>
            <Text style={styles.applyButtonText}>Apply Organization</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={styles.iconContainer} onPress={() => console.log('Facebook icon clicked')}>
            <Ionicons name="logo-facebook" size={28} color="#3b5998" />
        </TouchableOpacity>
      </ScrollView>
    </RootLayout>
  );
};


const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: Colors.white,
  },
  orgImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignSelf: 'center',
    marginBottom: 5,
  },
  orgName: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 5,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.grey,
    marginVertical: 20,
    marginTop: 5,
    marginBottom: 5,
  },
  detailsTitle: {
    fontSize: 18,
    marginTop: 10,
    marginBottom: 5,
  },
  detailsText: {
    fontSize: 16,
    marginBottom: 5,
  },
  bulletItem: {
    fontSize: 16,
    marginBottom: 5,
    marginLeft: 10,
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
  iconContainer: {
    marginTop: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
});
