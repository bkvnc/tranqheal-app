import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

const NotificationIndicator = ({ hasUnreadNotifications }) => {
  const pingAnim = useRef(new Animated.Value(0)).current;
  const animationRef = useRef(null);

  useEffect(() => {
    // Clear any existing animation
    if (animationRef.current) {
      animationRef.current.stop();
    }

    if (hasUnreadNotifications) {
      // Create and store the animation sequence
      animationRef.current = Animated.loop(
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
      );
      
      // Start the animation
      animationRef.current.start();
    } else {
      // Reset the animation value when there are no notifications
      pingAnim.setValue(0);
    }

    // Cleanup function to stop animation when component unmounts
    // or when hasUnreadNotifications changes
    return () => {
      if (animationRef.current) {
        animationRef.current.stop();
      }
    };
  }, [hasUnreadNotifications, pingAnim]);

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
      outputRange: [1, 0],
    }),
  };

  return (
    <View style={styles.indicator}>
      <Ionicons
        name={hasUnreadNotifications ? "notifications" : "notifications-outline"}
        size={35}
      />
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