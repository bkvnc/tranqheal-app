// src/hooks/useNotification.ts
import { db } from '../config/firebase';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { NotificationType } from './notificationTypes';

export const sendNotification = async (userId: string, message: string, notificationType: NotificationType) => {
    try {
        const notificationRef = collection(db, 'notifications');
        await addDoc(notificationRef, {
            userId,
            message,
            notificationType,
            timestamp: serverTimestamp(),
            isRead: false,
        });
    } catch (error) {
        console.error('Error sending notification:', error);
    }
};
