import React, { useState, useContext } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { RootLayout } from '../navigation/RootLayout';
import { AuthenticatedUserContext } from '../../shared/providers';

// Sample notifications data (for example purposes)
const initialNotifications = [
  { id: '1', time: '2 mins ago', description: 'Alan liked your post', origin: 'Post' },
  { id: '2', time: '10 mins ago', description: 'Allison commented on your post', origin: 'Comment' },
  { id: '3', time: '1 hour ago', description: 'The professional has accepted your matching', origin: 'Matching' },
];

export const NotificationScreen = () => {
  const { userType } = useContext(AuthenticatedUserContext);
  const [notifications, setNotifications] = useState(initialNotifications);
  const navigation = useNavigation();

  // Handle navigation to notification origin
  const handleNotificationPress = (notification) => {
    if (notification.origin === 'Post') {
      navigation.navigate('PostDetails', { postId: notification.id });
    } else if (notification.origin === 'Comment') {
      navigation.navigate('CommentDetails', { commentId: notification.id });
    } else if (notification.origin === 'Matching') {
      navigation.navigate('MatchingDetails', { matchingId: notification.id });
    } else {
      Alert.alert('Notification Error', 'Cannot navigate to the origin of this notification');
    }
  };

  // Clear all notifications
  const clearNotifications = () => {
    Alert.alert(
      "Clear All Notifications",
      "Are you sure you want to clear all notifications?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Clear", onPress: () => setNotifications([]) }
      ]
    );
  };

  // Render each notification item
  const renderNotificationItem = ({ item }) => (
    <TouchableOpacity onPress={() => handleNotificationPress(item)} style={styles.notificationItem}>
      <Text style={styles.notificationTime}>{item.time}</Text>
      <Text style={styles.notificationDescription}>{item.description}</Text>
    </TouchableOpacity>
  );

  return (
    <RootLayout navigation={navigation} screenName="Notifications" userType={userType}>
      <View style={{ flex: 1, padding: 20, backgroundColor: 'white' }}>
        <View style={styles.header}>
          <View style={styles.textContainer}>
            <Text style={styles.ProfileTitle}>Notifications</Text>
          </View>
          {/* Clear Notifications Button */}
          <TouchableOpacity onPress={clearNotifications} style={styles.clearButton}>
            <Ionicons name="trash-outline" size={24} color="black" />
            <Text style={styles.clearButtonText}>Clear All</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.divider} />
        {/* Display scrollable notifications */}
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
});

