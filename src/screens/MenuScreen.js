import React, { useContext } from 'react';
import { View, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { signOut } from 'firebase/auth';
import { auth } from '../config';
import { RootLayout } from '../navigation/RootLayout';
import { AuthenticatedUserContext } from '../providers';
import Ionicons from '@expo/vector-icons/Ionicons';

export const MenuScreen = ({ navigation }) => {
  const { userType } = useContext(AuthenticatedUserContext);

  const handleLogout = () => {
    signOut(auth).catch((error) => {
      console.log("Error signing out: ", error);
    });
  };

  return (
    <RootLayout screenName="Menu" navigation={navigation} userType={userType}>
      <View style={styles.container}>
        <View style={styles.divider} />
          <View style={styles.menuOption}>
            <TouchableOpacity style={styles.menuOption} onPress={handleLogout}>
              <Ionicons name="log-out-outline" size={30} color="black" />
              <Text style={styles.menuText}>Logout</Text>
            </TouchableOpacity>
          </View>
        <View style={styles.divider} />
      </View>
    </RootLayout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'flex-start',
    paddingTop: 40,
    backgroundColor: '#ffffff',
  },
  menuOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 7,
    paddingHorizontal: 7,
  },
  menuText: {
    marginLeft: 10,
    fontSize: 16,
    color: '#333',
  },
  divider: {
    height: 1,
    backgroundColor: '#ddd',
    marginVertical: 20,
    width: '100%',
    marginTop: 5,
    marginBottom: 5 ,

  },
});
