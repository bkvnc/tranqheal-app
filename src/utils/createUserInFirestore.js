import { doc, setDoc, getDoc, serverTimestamp} from 'firebase/firestore';
import { firestore } from '../config';
import { getDefaultProfileImage } from './getDefaultProfileImage';

export const createUserInFirestore = async (userId, username, email, collectionName, userType) => {
  const userRef = doc(firestore, collectionName, userId);

  try {
    const profileImageUrl = await getDefaultProfileImage();

    const userData = {
      username: username,
      email: email,
      profileImage: profileImageUrl,
      createdAt: serverTimestamp(),
      userType: userType,
      emailStatus: 'Unverified',
    }

    await setDoc(userRef, userData);

    console.log('User created successfully!');
    const userDoc = await getDoc(userRef);
    return userDoc.exists() ? userDoc.data() : null;
  } catch (error) {
    console.error('Error creating user in Firestore:', error.message);
  }
};
