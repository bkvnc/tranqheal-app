import {UserData} from './types';
import { useEffect, useState } from 'react';
import { db, auth } from '../config/firebase';
import {
    doc,
    getDoc,
    collection,
    query,
    where,
    getDocs,
    addDoc,
    deleteDoc,
    updateDoc,
    arrayRemove,
    arrayUnion,
} from 'firebase/firestore';


const useForum = (userId: string) => {
const [userData, setUserData] = useState<UserData | null>(null);

    
}