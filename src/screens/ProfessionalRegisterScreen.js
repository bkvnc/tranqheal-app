import React, { useState, useEffect } from 'react';
import { View, Image, StyleSheet, TouchableOpacity, Text, ScrollView } from 'react-native';
import RNPickerSelect from 'react-native-picker-select';
import { firestore } from '../config';
import { collection, getDocs } from 'firebase/firestore';
import { Alert } from 'react-native';
import { LoadingIndicator } from 'src/components';

export const ProfessionalRegisterScreen = ({ navigation, route }) => {
  const { userType } = route.params;
  const [organizations, setOrganizations] = useState([]);
  const [selectedOrg, setSelectedOrg] = useState(null);
  const [ isLoading, setIsLoading ] = useState(true);

  useEffect(() => {
    const fetchOrganizations = async () => {
      const orgsSnapshot = await getDocs(collection(firestore, 'organizations'));
      const orgList = orgsSnapshot.docs.map(doc => ({
        label: doc.data().organizationName,
        value: doc.id,
        key: doc.id,
      }));
      setOrganizations(orgList);
      setIsLoading(false);
    };
    fetchOrganizations();
  }, []);

  if (isLoading) {
    return <LoadingIndicator />;
  }

  return (
    <View style={styles.container}>
      {/* Logo Image */}
      <Image 
        source={require('../assets/tranqheal-logo.png')}  // Replace with the actual path to your logo file
        style={styles.logo}
        resizeMode="contain"
      />

      {/* Main Text */}
      <Text style={styles.mainText}>Are you part on any of this organizations?</Text>
      
      {/* Organization List */}
      <RNPickerSelect
        onValueChange={(value) => {
          const selectedOrganization = organizations.find(org => org.value === value);
          setSelectedOrg(selectedOrganization);
        }}
        items={organizations}
        placeholder={{ label: 'Select an organization', value: null }}
        style={{
          inputAndroid: styles.dropdown
        }}
      />
      {/* Yes Button */}
      <TouchableOpacity 
        style={styles.button}
        //onPress={() => navigation.navigate('SignUp')}
        onPress={() => {
          if (!selectedOrg) {
            Alert.alert('Error', 'Please select an organization.', [{ text: 'OK' }]);
          } else {
            navigation.navigate('Signup', { userType: userType, organizationId: selectedOrg.value, organizationName: selectedOrg.label, isRegistered: false });
          }
        }}  
      >
        <Text style={styles.buttonText}>Yes</Text>
      </TouchableOpacity>
      
      {/* No Button */}
      <TouchableOpacity 
        style={styles.button}
        onPress={() => navigation.navigate('Signup', { userType: userType })}
      >
        <Text style={styles.buttonText}>No</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',  // White background
    paddingHorizontal: 20,  // Padding to prevent items from touching the edges
  },
  logo: {
    width: 150,   // Adjusted size for better alignment
    height: 150,  // Adjusted size for better alignment
    marginBottom: 20,  // Space between logo and text/buttons
  },
  mainText: {
    fontSize: 22,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 20,
    color: '#000',
  },
  dropdown: {
    padding: 10,
    borderWidth: 1,
    borderRadius: 5,
    borderColor: '#ccc',
    marginBottom: 10,
  },
  button: {
    backgroundColor: '#9B51E0',  // Purple button color
    borderRadius: 25,  // Rounded button
    paddingVertical: 15,
    paddingHorizontal: 60,  // Wider buttons
    marginVertical: 10,  // Space between buttons
    width: 250,  // Fixed button width
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',  // White text color
    fontSize: 18,
    fontWeight: 'bold',
  }
});
