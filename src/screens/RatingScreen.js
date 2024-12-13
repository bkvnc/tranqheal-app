import React, { useContext, useEffect, useState } from 'react';
import { View, Text, Image, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { RootLayout } from '../navigation/RootLayout';
import Ionicons from '@expo/vector-icons/Ionicons';
import { AuthenticatedUserContext } from '../providers';
import { doc, getDoc, setDoc, updateDoc, increment } from 'firebase/firestore';
import { firestore, Colors, auth } from '../config';
import { LoadingIndicator } from 'src/components';

export const RatingScreen = ({ route, navigation }) => {
    const { professionalId } = route.params;
    const { userType, userId } = useContext(AuthenticatedUserContext);  
    const [professional, setProfessional] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [rating, setRating] = useState(0);
    const [userRating, setUserRating] = useState(null); 

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

            const professionalData = {
              ...data,
              fullName,
              underOrg: data.underOrg,
            };

            setProfessional(professionalData);

            // Fetch the user's rating if available
            const userRatings = data.userRatings || {}; // Ensure userRatings exists
            const userRating = userRatings[userId] || null; // If not rated, set to null
            setUserRating(userRating); 

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
    }, [professionalId, userId]);

    // Handle the rating logic
    const handleRating = (selectedRating) => {
      setRating(selectedRating); 
    };

    const handleSubmitRating = async () => {
        const user = auth.currentUser;
        if (!user) {
        console.error('User is not authenticated.');
        return;
        }
        
        if (rating > 0) {
            try {
            // Fetch professional details
            const userId = user.uid;
            const professionalRef = doc(firestore, 'professionals', professionalId);
            const docSnap = await getDoc(professionalRef);

            if (docSnap.exists()) {
                const data = docSnap.data();
                let userRatings = data.userRatings || {}; // Ensure userRatings exists

                // Add or update the user's rating
                if (userRating !== null) {
                // If the user has already rated, update their rating
                await updateDoc(professionalRef, {
                    [`userRatings.${userId}`]: rating, 
                });
                console.log('Rating updated!');
                } else {
                // If the user hasn't rated yet, add their rating and increment the number of ratings
                userRatings[userId] = rating; // Ensure userRatings is updated with the userId
                await updateDoc(professionalRef, {
                    userRatings,  // Set updated userRatings
                    numberOfRatings: increment(1), // Increment the total number of ratings
                });
                console.log('Rating submitted!');
                }

                // Re-fetch updated document to calculate total and average rating
                const updatedDocSnap = await getDoc(professionalRef);
                const updatedData = updatedDocSnap.data();
                const updatedUserRatings = updatedData.userRatings || {};

                // Calculate the new average rating
                const totalRatings = Object.values(updatedUserRatings).reduce((sum, rate) => sum + rate, 0);
                const newAverageRating = totalRatings / Object.keys(updatedUserRatings).length;

                // Update the average rating
                await updateDoc(professionalRef, {
                rating: newAverageRating,
                });

                console.log('Average rating updated!');
            }
            } catch (error) {
            console.error('Error submitting rating:', error.message);
            }

            navigation.goBack();
        } else {
            console.warn('Please select a rating before submitting.');
        }
    };

    const renderStars = () => {
      const stars = [];
      for (let i = 1; i <= 5; i++) {
        stars.push(
          <TouchableOpacity key={i} onPress={() => handleRating(i)}>
            <Ionicons
              name={i <= rating ? "star" : "star-outline"}
              size={30}
              color="#FFD700"
              style={{ marginHorizontal: 2 }}
            />
          </TouchableOpacity>
        );
      }
      return (
        <View style={styles.ratingRow}>
          <View style={styles.starContainer}>{stars}</View>
        </View>
      );
    };

    if (isLoading) {
      return <LoadingIndicator />;
    }

    return (
      <RootLayout navigation={navigation} screenName="RatingScreen" userType={userType}>
        <ScrollView contentContainerStyle={styles.container}>
          {/* Centered Content */}
          <View style={styles.centerContent}>
            {/* Professional Image */}
            <Image
              source={{ uri: professional.profileImage }} 
              style={styles.image}
            />

            {/* Professional Name */}
            <Text style={styles.profileName}>{professional?.fullName}</Text>

            {/* Rating Instruction */}
            <Text style={styles.ratingText}>Please rate your experience</Text>

            {/* Stars Rating */}
            {renderStars()} 

            {/* Submit Rating Button */}
            <TouchableOpacity style={styles.submitButton} onPress={handleSubmitRating}>
              <Text style={styles.submitButtonText}>Submit Rating</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </RootLayout>
    );
};


  const styles = StyleSheet.create({
    container: {
      flex: 1,  
      justifyContent: 'center',  
      alignItems: 'center',  
      paddingHorizontal: 20,  
    },
    centerContent: {
      alignItems: 'center',
      justifyContent: 'center',
      width: '100%', 
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
      fontSize: 24,
      fontWeight: 'bold',
      textAlign: 'center',
      marginVertical: 10,
    },
    ratingText: {
      fontSize: 18,
      textAlign: 'center',
      marginTop: 10,
      color: '#333',
    },
    ratingRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginVertical: 10,  
    },
    starContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    submitButton: {
        marginTop: 20,  
        paddingVertical: 12,
        paddingHorizontal: 30,
        backgroundColor: Colors.purple, 
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
      },
      submitButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
      },
  });
  
  
  







