import React, { useContext } from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { RootLayout } from '../navigation/RootLayout';
import { AuthenticatedUserContext } from '../../shared/providers';

export const OrganizationDetailsScreen = ({ route }) => {
  const { userType } = useContext(AuthenticatedUserContext);
  const { organization } = route.params;

  return (
    <RootLayout navigation={route.params.navigation} screenName="OrganizationDetails" userType={userType}>
        <View style={styles.container}>
            <Image source={{ uri: organization.image }} style={styles.orgImage} />
                <Text style={styles.orgName}>{organization.name}</Text>
                <Text style={styles.orgType}>Type: {organization.type}</Text>
                <Text style={styles.orgServices}>Services Offered: {organization.services}</Text>
                <Text style={styles.orgAddress}>Address: {organization.address}</Text>
                <Text style={styles.orgHours}>Hours Available: {organization.hoursAvailable}</Text>
                <Text style={styles.orgRating}>Rating: {organization.rating.toFixed(1)}</Text>
        </View>
    </RootLayout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: 'white',
  },
  orgImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignSelf: 'center',
    marginBottom: 20,
  },
  orgName: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
  },
  orgType: {
    fontSize: 18,
    color: '#555',
    marginBottom: 10,
  },
  orgServices: {
    fontSize: 16,
    marginBottom: 10,
  },
  orgAddress: {
    fontSize: 16,
    marginBottom: 10,
  },
  orgHours: {
    fontSize: 16,
    marginBottom: 10,
  },
  orgRating: {
    fontSize: 16,
    marginBottom: 10,
  },
});
