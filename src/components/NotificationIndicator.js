import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

const NotificationIndicator = ({ hasUnreadNotifications }) => {
  const pingAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (hasUnreadNotifications) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pingAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pingAnim, {
            toValue: 0,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pingAnim.setValue(0);
    }
  }, [hasUnreadNotifications]);

  const pingStyle = {
    transform: [
      {
        scale: pingAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [1, 2.5],
        }),
      },
    ],
    opacity: pingAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [1, 0], // Fades out as it expands
    }),
  };

  return (
    <View style={styles.indicator}>
      {hasUnreadNotifications ? (
        <Ionicons name="notifications" size={35} />
      ) : (
        <Ionicons name="notifications-outline" size={35} />
      )}
      {hasUnreadNotifications && (
        <View style={styles.notificationCircle}>

          <Animated.View style={[styles.pingCircle, pingStyle]} />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  indicator: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationCircle: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: 'red',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pingCircle: {
    position: 'absolute',
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: 'red',
    opacity: 0.5,
  },
});

export default NotificationIndicator;
