import React, { useContext } from 'react';
import { View, Text, Image, StyleSheet, ScrollView } from 'react-native';
import { RootLayout } from '../navigation/RootLayout';
import Ionicons from '@expo/vector-icons/Ionicons';
import { AuthenticatedUserContext } from '../../shared/providers';

export const ProfessionalDetailsScreen = ({ route, navigation }) => {
  const { userType } = useContext(AuthenticatedUserContext);
    const { professional } = route.params; // Get the professional data passed during navigation

    const renderStars = (rating) => {
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

    return (
      <RootLayout navigation={navigation} screenName="ProfessionalDetails" userType={userType}>
       <ScrollView>
        <View style={styles.imageContainer} key={professional.id} marginTop={20}>
          <Image source={{ uri: professional.image }} style={styles.image} />
        </View>
        <View style={styles.detailsContainer}>
          <Text style={{ fontSize: 30, fontWeight: 'bold' }}>{professional.name}</Text>
            <View style={styles.ratingRow}>
              <Text style={{ fontWeight: 'bold', marginRight: 5 }}>{professional.rating}</Text>
              <View style={styles.starContainer}>{renderStars(professional.rating)}</View>
            </View>
          <Text style={styles.detailsText}>{professional.specialty}</Text>
          <View style={styles.divider} />
          <Text style={styles.detailsTitle}>Availability</Text>
          <Text style={styles.detailsText}>
            {Array.isArray(professional.availability) ? professional.availability.join(', ') : 'N/A'}
          </Text>
          <Text style={styles.detailsText}>{professional.availableTimes}</Text>
          <Text style={styles.detailsTitle}>Contact Details</Text>
          <Text style={styles.detailsText}>Email: {professional.email}</Text>
          <Text style={styles.detailsText}>Phone: {professional.phone}</Text>
        </View>
        </ScrollView>
      </RootLayout>
    );
}

const styles = StyleSheet.create({
    professionalDetails: {
      flex: 1,
      justifyContent: 'center',
    },
    imageContainer: {
      alignItems: 'center',
      marginBottom: 20,
    },
    image: {
      width: 165,
      height: 165,
      borderRadius: 100,
    },
    detailsContainer: {
      alignItems: 'center',
    },
    detailsTitle: {
      fontSize: 24,
      fontWeight: 'bold',
      marginBottom: 10,
    },
    detailsText: {
      fontSize: 16,
      marginBottom: 5,
    },
    starContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    divider: {
      height: 1,
      backgroundColor: '#ddd',
      marginVertical: 20,
    },
    ratingRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 10,
    }
});
