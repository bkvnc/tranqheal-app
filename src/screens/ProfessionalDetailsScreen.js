import React, { useContext, useEffect, useState } from 'react';
import { View, Text, Image, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { RootLayout } from '../navigation/RootLayout';
import Ionicons from '@expo/vector-icons/Ionicons';
import { AuthenticatedUserContext } from '../providers';
import { doc, getDoc } from 'firebase/firestore';
import { firestore } from '../config';
import { LoadingIndicator } from 'src/components';

const SPECIALIZATION_MAPPING = {
  depress: 'Depression',
  anxiety: 'Anxiety',
  stress: 'Stress'
};

export const ProfessionalDetailsScreen = ({ route, navigation }) => {
  const { professionalId } = route.params || {}; 
  const { userType } = useContext(AuthenticatedUserContext);
  const [professional, setProfessional] = useState(null);
  const [organizationData, setOrganizationData] = useState(null);
  const [isloading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        if (!professionalId) {
          throw new Error('No professionalId provided in route params.');
        }
  
        // Fetch professional details
        const professionalRef = doc(firestore, 'professionals', professionalId);
        const docSnap = await getDoc(professionalRef);
  
        if (docSnap.exists()) {
          const data = docSnap.data();
  
          const fullName = [
            data.firstName,
            data.middleName,
            data.lastName
          ].filter(Boolean).join(' ');
  
          const availability = data.availability
            ? Object.entries(data.availability)
                .filter(([_, value]) => value) 
                .map(([key]) => key.charAt(0).toUpperCase() + key.slice(1)) 
            : [];
  
          const specialization = data.specialization
            ? Object.entries(data.specialization)
                .filter(([_, value]) => value) 
                .map(([key]) => SPECIALIZATION_MAPPING[key] || key) 
            : [];
  
          const professionalData = {
            ...data,
            fullName,
            availability,
            specialization,
            underOrg: data.underOrg || null,
          };
  
          setProfessional(professionalData);
  
          // Fetch organization details if `underOrg` exists
          if (professionalData.underOrg) {
            const organizationRef = doc(firestore, 'organizations', professionalData.underOrg);
            const orgDocSnap = await getDoc(organizationRef);
  
            if (orgDocSnap.exists()) {
              setOrganizationData(orgDocSnap.data());
            } else {
              console.warn('Organization document not found.');
            }
          }
        } else {
          console.warn('Professional document not found.');
        }
      } catch (error) {
        console.error('Error fetching details:', error.message);
      } finally {
        setIsLoading(false);
      }
    };
  
    fetchDetails();
  }, [professionalId]);
  

  
  const renderStars = (rating = 0) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Ionicons
          key={i}
          name={i <= Math.round(rating) ? 'star' : 'star-outline'}
          size={30}
          color="#FFD700"
        />
      );
    }
    return stars;
  };

  if (isloading) {
    return <LoadingIndicator />;
  }

  return (
    <RootLayout navigation={navigation} screenName="ProfessionalDetails" userType={userType}> 
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.centerContent}>
          <Image 
            source={{ uri: professional.profileImage }} 
            style={styles.image} 
          />
          <Text style={styles.profileName}>
            {professional.fullName}
          </Text>
          <View style={styles.ratingRow}>
            <Text style={{ fontWeight: 'bold', marginRight: 5 }}>
              {professional.rating?.toFixed(1) || 'N/A'}
            </Text>
            <View style={styles.starContainer}>{renderStars(professional.rating || 0)}</View>
          </View>
          <TouchableOpacity 
            style={styles.iconContainer} 
            onPress={() => console.log('Facebook icon clicked')}>
            <Ionicons name="logo-facebook" size={28} color="#3b5998" />
          </TouchableOpacity>
        </View>
        <View style={styles.divider} />
        <View style={styles.card}>
          <Text style={styles.detailsTitle}>Profile Details</Text>
          <Text style={styles.detailsText}>Age: {professional.age || 'N/A'}</Text>
          <Text style={styles.detailsText}>Gender: {professional.gender || 'N/A'}</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.detailsTitle}>Availability</Text>
          <Text style={styles.detailsText}>
            {professional.availability.length > 0
              ? professional.availability.join('    ')
              : 'Not available'}
          </Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.detailsTitle}>Specialization</Text>
          <Text style={styles.detailsText}>
            {professional.specialization.length > 0
              ? professional.specialization.join('    ')
              : 'None'}
          </Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.detailsTitle}>Contact Details</Text>
          <Text style={styles.detailsText}>Phone: {professional.mobileNumber || 'N/A'}</Text>
          <Text style={styles.detailsText}>Email: {professional.email || 'N/A'}</Text>
        </View>
        {professional.underOrg && organizationData && (
          <View style={styles.card}>
            <Text style={styles.detailsTitle}>Affiliated Organization</Text>
            <Text style={styles.detailsText}>{organizationData.organizationName || 'N/A'}</Text>
          </View>
        )} 
      </ScrollView>
    </RootLayout>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 30,
  },
  centerContent: {
    alignItems: 'center', 
    justifyContent: 'center', 
  },
  image: {
    width: 150,
    height: 150,
    borderRadius: 75,
    borderWidth: 2,
    borderColor: '#d1d1d1',
    backgroundColor: '#f8f8f8',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
  },
  profileName: {
    fontSize: 30,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 10,
  },
  starContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 10,
    marginTop: 5,
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    borderRadius: 20,
  },
  card: {
    backgroundColor: '#ffffff',
    padding: 15,
    marginVertical: 10,
    marginTop: 5,
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
    marginBottom: 5,
  },
  divider: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginVertical: 20,
    marginTop: 5,
    marginBottom : 10,
    width: '90%',
    alignSelf: 'center',
  },
});







