import React, { useContext, useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { RootLayout } from '../navigation/RootLayout';
import { AuthenticatedUserContext } from '../providers';
import { Colors } from '../config';
import { auth, firestore } from 'src/config';
import { collection, doc, query, orderBy, limit, getDocs, setDoc, getDoc, serverTimestamp, updateDoc } from 'firebase/firestore';


export const SeekProfessionalScreen = ({ navigation, route }) => {
  const { userType } = useContext(AuthenticatedUserContext);
  const { matchData, userProfileImage } = route.params;
  const bestMatch = matchData.length ? matchData[0] : null;

  const handleSendRequest = async () => {
    if (!bestMatch?.id) {
      console.error('Error: Professional ID is missing in match data.');
      return;
    }

    const currentUser = auth.currentUser;
  
    if (!currentUser?.uid) {
      console.error('Error: User ID is undefined.');
      return;
    }
  
    try {
      const userId = currentUser.uid;
      const assessmentsRef = collection(firestore, 'users', userId, 'selfAssessment');
      const q = query(assessmentsRef, orderBy('createdAt', 'desc'), limit(1)); 
      const professionalRef = doc(firestore, 'professionals', bestMatch.id); 
      const matchingRequestsRef = collection(professionalRef, 'matchingRequests'); 
      const requestDocRef = doc(matchingRequestsRef,  currentUser?.uid); 
      const profSnapshot = await getDoc(professionalRef);
      const userSnapshot = await getDoc(doc(firestore, 'users', currentUser?.uid));
      const querySnapshot = await getDocs(q);
  
      if (!querySnapshot.empty) {
        const docSnap = querySnapshot.docs[0];
        const docRef = doc(firestore, docSnap.ref.path); 
        await updateDoc(docRef, { profId : bestMatch.id });
      };
  
      const requestData = {
        userId: currentUser?.uid,
        professionalId: bestMatch.id,
        requesterName: userSnapshot.data().firstName + ' ' + userSnapshot.data().lastName,
        status: 'pending',
        requestedAt: serverTimestamp(),
      };

      const notificationRef = doc(collection(firestore, `notifications/${bestMatch.id}/messages`)); 

      await setDoc(notificationRef, {
        recipientId: bestMatch.id,
        recipientType: profSnapshot.data().userType,  
        message: `You've been matched! A seeker is seeking you expertise. Please review and respond to the request at your earliest convenience.`,
        type: `matching`,
        createdAt: serverTimestamp(), 
        isRead: false,
      });

      const notificationDoc = await getDoc(notificationRef);
      const notificationData = notificationDoc.data();

      if (notificationData && notificationData.createdAt) {
        const createdAtDate = notificationData.createdAt.toDate();
        console.log("Notification createdAt:", createdAtDate);
      }

      await setDoc(requestDocRef, requestData); 
      console.log('Request sent successfully!');
      navigation.navigate('Success');
    } catch (error) {
      console.error('Error sending request:', error);
    }
  };
  
  const handleToggleViewProfessional = () => {
    if (bestMatch) {
      navigation.navigate('ProfessionalDetails', { professionalId: bestMatch.id, fromMatching: true });
    }
  };

  return (
    <RootLayout screenName={'SeekProfessional'} navigation={navigation} userType={userType}>
      <View style={styles.container}>
        {bestMatch ? (
          <>
            {/* Center Profile Pictures and "It's a match!" Text */}
            <View style={styles.picturesContainer}>
              <Image
                source={{ uri: userProfileImage }}
                style={styles.profilePicture}
              />
              <Text style={styles.matchingText}>🤝</Text>
              <Image
                source={{ uri: bestMatch.profileImage }}
                style={styles.profilePicture}
              />
            </View>

            <Text style={styles.matchText}>It's a match!</Text>

            {/* Buttons to either send request or toggle view professional details */}
            <View style={styles.buttonsContainer}>
              <TouchableOpacity style={[styles.button, styles.sendButton]} onPress={handleSendRequest}>
                <Text style={styles.buttonText}>Send Request</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.viewButton]}
                onPress={handleToggleViewProfessional}
              >
                <Text style={styles.buttonText}>View Professional</Text>
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <Text style={styles.noMatchText}>No professionals match your preferences at this time.</Text>
        )}
      </View>
    </RootLayout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  picturesContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  profilePicture: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginHorizontal: 10,
  },
  matchingText: {
    fontSize: 30,
    marginHorizontal: 10,
  },
  matchText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.black,
    marginBottom: 30,
  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 20,
  },
  button: {
    paddingVertical: 10,
    paddingHorizontal: 25,
    borderRadius: 30,
    width: '45%',
    alignItems: 'center',
  },
  sendButton: {
    backgroundColor: Colors.purple,
  },
  viewButton: {
    backgroundColor: Colors.purple,
    borderColor: '#ccc',
    borderWidth: 1,
  },
  buttonText: {
    fontSize: 18,
    color: '#fff',
    fontWeight: 'bold',
  },
  detailsContainer: {
    marginTop: 30,
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  detailText: {
    fontSize: 16,
    color: '#555',
    marginBottom: 5,
  },
  noMatchText: {
    fontSize: 18,
    color: '#888',
    textAlign: 'center',
  },
  otherProfessionalsContainer: {
    marginTop: 20,
    width: '100%',
  },
  otherProfessionalCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    marginVertical: 5,
    backgroundColor: '#f9f9f9',
    borderRadius: 5,
  },
  otherProfessionalDetails: {
    marginLeft: 15,
  },
  otherProfessionalName: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  otherProfessionalRating: {
    fontSize: 16,
    color: '#777',
  },
});