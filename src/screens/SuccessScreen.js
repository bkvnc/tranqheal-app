import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { RootLayout } from '../navigation/RootLayout'; 
import { Colors } from '../config';

export const SuccessScreen = ({ navigation }) => {

  const handleGoBack = () => {
    navigation.navigate('Home');
  };

  return (
    <RootLayout screenName={'Success'} navigation={navigation} >
        <View style={styles.container}>
       
        <Image
            source={require('../assets/pngwing.com.png')} 
            style={styles.successImage}
        />
        <Text style={styles.successText}>Request Sent Successfully!</Text>
       
        <Text style={styles.descriptionText}>
            The professional has been notified and will review your request soon. You can track the request in your notifications or matching requests.
        </Text>
       
        </View>

        <View style={styles.bottomContainer}>
        <TouchableOpacity style={styles.button} onPress={handleGoBack}>
            <Text style={styles.buttonText}>Go Back</Text>
        </TouchableOpacity>
        </View>
    </RootLayout>
  );
};



const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'space-between', 
  },
  bottomContainer: {
    alignItems: 'center', 
  },
  successImage: {
    width: 150,
    height: 150,
    marginBottom: 20,
  },
  successText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#9F4FDD',
    textAlign: 'center',
    marginBottom: 15,
  },
  descriptionText: {
    fontSize: 16,
    color: Colors.gray,
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 22,
  },
  button: {
   backgroundColor: Colors.purple,  
    paddingVertical: 15,
    paddingHorizontal: 100,
    borderRadius: 30,
  },
  buttonText: {
    fontSize: 18,
    color: '#fff',
    fontWeight: 'bold',
  },
});
