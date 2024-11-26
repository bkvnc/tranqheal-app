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
  const [isloading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProfessionalDetails = async () => {
      try {
        if (!professionalId) {
          throw new Error('No professionalId provided in route params.');
        }

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

          setProfessional({
            ...data,
            fullName,
            availability,
            specialization,
          });
        } else {
          console.warn('Professional document not found.');
        }
      } catch (error) {
        console.error('Error fetching professional details:', error.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfessionalDetails();
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
      <ScrollView>
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: professional.profileImage }} 
            style={styles.image}
          />
        </View>
        <View style={styles.detailsContainer}>
          <Text style={{ fontSize: 30, fontWeight: 'bold' }}>{professional.fullName}</Text>
          <View style={styles.ratingRow}>
            <Text style={{ fontWeight: 'bold', marginRight: 5 }}>
              {professional.rating?.toFixed(1) || 'N/A'}
            </Text>
            <View style={styles.starContainer}>{renderStars(professional.rating || 0)}</View>
          </View>
          <View style={styles.divider} />
          <Text style={styles.detailsTitle}>Profile Details</Text>
          <Text style={styles.detailsText}>Age: {professional.age || 'N/A'}</Text>
          <Text style={styles.detailsText}>Gender: {professional.gender || 'N/A'}</Text>
          <View style={styles.divider} />
          <Text style={styles.detailsTitle}>Availability</Text>
          <Text style={styles.detailsText}>
            {professional.availability.length > 0
              ? professional.availability.join('    ')
              : 'Not available'}
          </Text>
          <View style={styles.divider} />
          <Text style={styles.detailsTitle}>Specialization</Text>
          <Text style={styles.detailsText}>
            {professional.specialization.length > 0
              ? professional.specialization.join('    ')
              : 'None'}
          </Text>
          <View style={styles.divider} />
          <Text style={styles.detailsTitle}>Contact Details</Text>
          <Text style={styles.detailsText}>Phone: {professional.mobileNumber || 'N/A'}</Text>
          <Text style={styles.detailsText}>Email: {professional.email || 'N/A'}</Text>
          <TouchableOpacity style={styles.iconContainer} onPress={() => console.log('Facebook icon clicked')}>
            <Ionicons name="logo-facebook" size={28} color="#3b5998" />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </RootLayout>
  );
};

const styles = StyleSheet.create({
  imageContainer: {
    alignItems: 'center',
    marginBottom: 5,
    marginTop: 5,
  },
  image: {
    width: 150,
    height: 150,
    borderRadius: 100,
  },
  detailsContainer: {
    alignItems: 'center',
  },
  detailsTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  detailsText: {
    fontSize: 16,
  
    textAlign: 'center',
  },
  starContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    marginTop: 5,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  divider: {
    height: 1,
    backgroundColor: '#ddd',
    marginVertical: 20,
    width: '90%',
    marginBottom: 10 ,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',

  },
});
