
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../config/firebase'; 

export async function saveTokenToFirestore(userId: string, token: string, userType: string) {
  try {
    // Define the collection based on the userType
    let collectionPath = '';

    // Assign the correct collection path
    switch (userType) {
      case 'organization':
        collectionPath = 'organizations';
        break;
      case 'professional':
        collectionPath = 'professionals';
        break;
      case 'admin':
        collectionPath = 'admins';
        break;
      case 'seeker':
        collectionPath = 'seekers';
        break;
      default:
        console.error('Invalid user type');
        return;
    }

    // Save the token to the correct collection
    await setDoc(doc(db, collectionPath, userId), { fcmToken: token }, { merge: true });
    console.log(`Token saved to Firestore for ${userType} user:`, userId);
  } catch (error) {
    console.error('Error saving token to Firestore:', error);
  }
}
