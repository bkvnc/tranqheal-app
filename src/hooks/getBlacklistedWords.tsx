import { collection, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase'; 

export const getBlacklistedWords = async (): Promise<string[]> => {
    try {
        const blacklistedWordsRef = collection(db, 'blacklistedWords');
        const snapshot = await getDocs(blacklistedWordsRef);

        // Extract the words from the snapshot
        const words = snapshot.docs.map(doc => doc.data().word as string);
        return words;
    } catch (error) {
        console.error('Error fetching blacklisted words:', error);
        return []; // Return an empty array if there's an error
    }
};
