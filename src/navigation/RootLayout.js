import React from 'react';
import { View, TouchableOpacity, StyleSheet, Image, SafeAreaView, StatusBar } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Colors } from '../config';
import NotificationIndicator from '../components/NotificationIndicator';
import { useState } from 'react';
import { useNotifications } from '../components/NotificationContext';
import { AuthenticatedUserContext } from '../providers';

export const RootLayout = ({ children, navigation, screenName, userType,  }) => {
  const { hasUnreadNotifications } = useNotifications();
  

  const renderLeftIcon = () => {
    if (screenName === 'Home' || screenName === 'ProfessionalHome') {
      return (
        <TouchableOpacity onPress={() => navigation.navigate('Menu')}>
          <Ionicons name="menu" size={30} color="black" />
        </TouchableOpacity>
      );
    } else {
      return (
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={30} color="black" />
        </TouchableOpacity>
      );
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>

        <StatusBar barStyle="dark-content" backgroundColor={'white'}/>

        {/* Header */}
        <View style={styles.header}>
            {renderLeftIcon()}
            <Image source={require('../assets/small-logo.jpg')} style={styles.logo} />
            <TouchableOpacity onPress={() => navigation.navigate('Notifications')}>
            <NotificationIndicator hasUnreadNotifications={hasUnreadNotifications} />
          </TouchableOpacity>
        </View>

        {/* Main content (children) */}
        <View style={{ flex: 1 }}>{children}</View>

        {/* Footer Navigation */}
        <View style={styles.footer}>
            <TouchableOpacity onPress={() => {
                if (screenName === 'Home' || screenName === 'ProfessionalHome') {
                  navigation.navigate(screenName);
                } else if (userType === "user") {
                  navigation.navigate('Home');
                } else if (userType === "professional") {
                  navigation.navigate('ProfessionalHome');
                }
              }} style={styles.navButton}>
              <View style={screenName === 'Home' || screenName === 'ProfessionalHome' ? styles.activeIconContainer : styles.iconContainer}>
                <Ionicons name="home-outline" size={30} color='black'/>
              </View>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigation.navigate('Mood')} style={styles.navButton}>
              <View style={screenName === 'Mood' ? styles.activeIconContainer : styles.iconContainer}>
                <Ionicons name="happy-outline" size={30} color='black'/>
              </View>
            </TouchableOpacity>
            <TouchableOpacity onPress={() =>{
              
            }}>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => {
                if (screenName === 'Profile' || screenName === 'ProfessionalProfile') {
                  navigation.navigate(screenName);
                } else if (userType === "user") {
                  navigation.navigate('Profile');
                } else if (userType === "professional") {
                  navigation.navigate('ProfessionalProfile');
                }
              }} style={styles.navButton}>
              <View style={screenName === 'Profile' || screenName === 'ProfessionalProfile' ? styles.activeIconContainer : styles.iconContainer}>
                <Ionicons name="person-outline" size={30} color='black'/>
              </View>
            </TouchableOpacity>
        </View>
    </SafeAreaView>
  );
  
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
    backgroundColor: Colors.white,
    elevation: 3,
  },
  logo: {
    width: 150,
    height: 40,
    resizeMode: 'contain',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 5,
    backgroundColor: Colors.white,
    elevation: 10,
  },
  navButton: {
    flex: 1,
    alignItems: 'center',
    padding: 5,
  },
  iconContainer: {
    padding: 5,
    borderRadius: 20,
  },
  activeIconContainer: {
    padding: 10,
    borderRadius: 20,
    backgroundColor: Colors.lightpurple,
  },
});
