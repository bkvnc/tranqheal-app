import React, { useState, useContext, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { RootLayout } from '../navigation/RootLayout';
import { AuthenticatedUserContext } from '../providers';
import { auth, firestore } from '../config/firebase';
import { doc, query, collection, orderBy, onSnapshot, updateDoc, deleteDoc, writeBatch } from 'firebase/firestore';


export const NotificationScreen = () => {
  const { userType } = useContext(AuthenticatedUserContext);
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [hasUnreadNotifications, setHasUnreadNotifications] = useState(false);

  const user = auth.currentUser;

  useEffect(() => {
    const fetchNotifications = async () => {
      if (!user) return;
      try {
        const notificationsRef = collection(firestore, `notifications/${user.uid}/messages`);
        const q = query(notificationsRef, orderBy('createdAt', 'desc'));

        const unsubscribe = onSnapshot(q, (snapshot) => {
          const userNotifications = snapshot.docs.map((doc) => {
            const data = doc.data();
            return {
              id: doc.id,
              message: data.message,
              recipientId: data.recipientId,
              recipientType: data.recipientType,
              createdAt: data.createdAt ? data.createdAt.toDate() : null,
              isRead: data.isRead || false,
              type: data.type,
            };
          });
          setNotifications(userNotifications);
        });


        return () => unsubscribe();
      } catch (error) {
        console.error('Error fetching notifications: ', error);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, [user]);

  useEffect(() => {
    setHasUnreadNotifications(
      notifications.some((notification) => !notification.isRead)
    );
  }, [notifications]);

  const markNotificationAsRead = async (id) => {
    try {
      const notificationRef = doc(firestore, `notifications/${user.uid}/messages`, id);
      await updateDoc(notificationRef, { isRead: true });
    } catch (error) {
      console.error("Error marking notification as read: ", error);
    }
  };

  const handleMarkAsRead = async (id) => {
    try {
      await markNotificationAsRead(id);  // Your function to update the notification in Firebase
      setNotifications((prevNotifications) =>
        prevNotifications.map((notification) =>
          notification.id === id ? { ...notification, isRead: true } : notification
        )
      );
  
      // Check if any notifications are still unread
      const unreadNotifications = notifications.some((notification) => !notification.isRead);
      setHasUnreadNotifications(unreadNotifications);
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };
  
  
  const clearNotifications = () => {
    Alert.alert(
      'Clear All Notifications',
      'Are you sure you want to clear all notifications?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          onPress: async () => {
            try {
              const batch = writeBatch(firestore); // Firestore batch to delete notifications
              notifications.forEach((notification) => {
                const notificationRef = doc(
                  firestore,
                  `notifications/${user.uid}/messages`,
                  notification.id
                );
                batch.delete(notificationRef);
              });
              await batch.commit();
              setNotifications([]); // Clear notifications
              setHasUnreadNotifications(false); // Reset unread state
            } catch (error) {
              console.error("Error clearing notifications:", error);
            }
          },
        },
      ]
    );
  };
  
    

  const formatDate = (date) => {
    if (!date) return '';
    return date.toLocaleString();
  };

  const renderNotificationItem = ({ item }) => (
    <TouchableOpacity
      style={[styles.notificationItem, item.isRead ? styles.read : styles.unread]}
      onPress={() => handleMarkAsRead(item.id)}
    >
      <Text style={styles.notificationTime}>{formatDate(item.createdAt)}</Text>
      <Text style={styles.notificationDescription}>{item.message}</Text>
      {!item.isRead && (
        <TouchableOpacity onPress={() => handleMarkAsRead(item.id)} style={styles.markAsReadButton}>
          <Text style={styles.markAsReadText}>Mark as Read</Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );


  return (
    <RootLayout navigation={navigation} screenName="Notifications" userType={userType}>
      <View style={{ flex: 1, padding: 20, backgroundColor: 'white' }}>
        
        <View style={styles.header}>
          <View style={styles.textContainer}>
            <Text style={styles.ProfileTitle}>Notifications</Text>
          </View>
          <TouchableOpacity onPress={clearNotifications} style={styles.clearButton}>
            <Ionicons name="trash-outline" size={24} color="black" />
            <Text style={styles.clearButtonText}>Clear All</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.divider} />
        <FlatList
          data={notifications}
          renderItem={renderNotificationItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      </View>
    </RootLayout>
  );

};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  textContainer: {
    flex: 1,
    marginRight: 10,
  },
  ProfileTitle: {
    fontSize: 40,
    fontWeight: 'bold',
  },
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 5,
  },
  clearButtonText: {
    fontSize: 16,
    marginLeft: 5,
    color: 'black',
  },
  divider: {
    height: 1,
    backgroundColor: '#ddd',
    marginVertical: 20,
  },
  notificationItem: {
    padding: 15,
    marginVertical: 10,
    backgroundColor: '#F7F2FA',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  notificationTime: {
    fontSize: 12,
    color: '#888',
    marginBottom: 5,
    fontWeight: 'bold',
  },
  notificationDescription: {
    fontSize: 16,
    color: '#333',
  },
  markAsReadButton: {
    marginTop: 5,
  },
  markAsReadText: {
    fontSize: 14,
    color: 'blue',
  },
  read: {
    opacity: 0.6,
  },
  unread: {
    opacity: 1,
  },
});
