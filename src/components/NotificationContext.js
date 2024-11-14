
import React, { createContext, useState, useContext, useEffect } from 'react';
import { auth, firestore } from '../config/firebase';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const [hasUnreadNotifications, setHasUnreadNotifications] = useState(false);

  const user = auth.currentUser;

  useEffect(() => {
    if (!user) return;

    const notificationsRef = collection(firestore, `notifications/${user.uid}/messages`);
    const q = query(notificationsRef, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const hasUnread = snapshot.docs.some(doc => !doc.data().isRead);
      setHasUnreadNotifications(hasUnread);
    });

    return () => unsubscribe();
  }, [user]);

  return (
    <NotificationContext.Provider value={{ hasUnreadNotifications, setHasUnreadNotifications }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};


