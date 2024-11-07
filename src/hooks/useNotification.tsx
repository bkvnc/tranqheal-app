// src/hooks/useNotification.ts
import { db } from '../config/firebase';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { NotificationType } from './notificationTypes';

export const sendNotification = async (userId: string, message: string, notificationType: NotificationType) => {
    try {
        const userNotificationsRef = collection(db, `users/${userId}/notifications`);
        
        await addDoc(userNotificationsRef, {
            message,
            notificationType,
            timestamp: serverTimestamp(),
            isRead: false,
        });
        
        console.log(`Notification sent to user with ID: ${userId}`);
    } catch (error) {
        console.error('Error sending notification:', error);
    }
};
