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
            The professional has been notified and will review your request soon. 
            You will be notified when the professional has accepted your request.
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
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 30,
  },
  successImage: {
    width: 120,
    height: 120,
    marginBottom: 20,
    resizeMode: 'contain', 
  },
  successText: {
    fontSize: 26,
    fontWeight: 'bold',
    color: Colors.green,
    textAlign: 'center',
    marginBottom: 10,
 
    letterSpacing: 1,
  },
  descriptionText: {
    fontSize: 16,
    color: Colors.gray,
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 24,
    paddingHorizontal: 10,
  },
  bottomContainer: {
    width: '100%',
    position: 'absolute',
    bottom: 40,
    alignItems: 'center',
  },
  button: {
    backgroundColor: Colors.purple,
    paddingVertical: 14,
    paddingHorizontal: 50,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 5,
    alignSelf: 'center',
  },
  buttonText: {
    fontSize: 18,
    color: '#fff',
    fontWeight: '600',
    textAlign: 'center',
    textTransform: 'uppercase',
  },
});
