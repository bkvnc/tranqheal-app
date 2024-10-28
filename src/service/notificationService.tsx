// src/services/notificationService.ts
import { collection, addDoc, query, where, getDocs, updateDoc, doc } from "firebase/firestore";
import { db } from "../config/firebase";

export const addNotification = async (userId: string, message: string) => {
  try {
    await addDoc(collection(db, "notifications"), {
      userId,
      message,
      timestamp: new Date(),
      isRead: false,
    });
  } catch (error) {
    console.error("Error adding notification:", error);
  }
};



export const markNotificationAsRead = async (notificationId: string) => {
  const notificationRef = doc(db, "notifications", notificationId);
  await updateDoc(notificationRef, {
    isRead: true,
  });
};
