import React, { useState, useEffect } from 'react';
import { getAuth, onAuthStateChanged, User } from 'firebase/auth';
import { getFirestore, doc, updateDoc } from 'firebase/firestore';
import { toast } from 'react-toastify';

const auth = getAuth();
const db = getFirestore();

const EmailVerificationListener: React.FC = () => {
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user: User | null) => {
            if (user) {
                await user.reload(); 
                if (user.emailVerified) {
                    try {
                       
                        const collectionName = 'organizations'; 
                        const docRef = doc(db, collectionName, user.uid);
                        await updateDoc(docRef, {
                            status: 'Verified',
                        });
                        toast.success('Your account has been verified!');
                    } catch (error) {
                        console.error('Error updating status to Verified:', error);
                        toast.error('Error verifying account. Please try again.');
                    }
                }
            }
        });

        return () => unsubscribe(); 
    }, []);

    return null;
};

export default EmailVerificationListener;
