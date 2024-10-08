import React, { useContext } from 'react';
import { View, Button, StyleSheet, Text } from 'react-native';
import { signOut } from 'firebase/auth';
import { auth } from '../../shared/config';
import { RootLayout } from '../navigation/RootLayout';
import { AuthenticatedUserContext } from '../../shared/providers';

export const MenuScreen = ({ navigation }) => {
  const { userType } = useContext(AuthenticatedUserContext);
  const handleLogout = () => {
    signOut(auth).catch((error) => {
      console.log("Error signing out: ", error);
    });
  }
  return (
    <RootLayout screenName="Menu" navigation={navigation} userType={userType}>
      <View style={styles.container}>
        <Text>Menu Screen</Text> 
        <Button title="Logout" onPress={handleLogout} />
      </View>
    </RootLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
