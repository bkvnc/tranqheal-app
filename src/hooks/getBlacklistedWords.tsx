import { getFirestore, collection, getDocs } from 'firebase/firestore';

const db = getFirestore();
import { getAuth } from 'firebase/auth';

export const getBlacklistedWords = async () => {
    const auth = getAuth();
    const user = auth.currentUser;
  
    if (!user) {
      console.error("User is not authenticated");
      throw new Error("User is not authenticated");
    }
  
    try {
        const querySnapshot = await getDocs(collection(db, 'blacklistedWords'));
        const words: string[] = [];
        querySnapshot.forEach((doc) => {
            words.push(doc.data().word); // Adjust based on your document structure
        });
        return words;
    } catch (error) {
        console.error("Error fetching blacklisted words:", error);
        throw error; // Rethrow the error for handling in the calling function
    }
};