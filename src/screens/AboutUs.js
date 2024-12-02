import React, { useContext } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { RootLayout } from '../navigation/RootLayout';
import { AuthenticatedUserContext } from 'src/providers';

export const AboutUs = ({ navigation }) => {
  const { userType } = useContext(AuthenticatedUserContext);
  return (
    <RootLayout screenName="AboutUs" navigation={navigation} userType={userType}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.container}>
        <Text style={styles.heading}>About Us</Text>
        <Text style={styles.paragraph}>
          Welcome to TranqHeal! Our mission is to provide accessible and personalized mental health support
          through innovative technology. We aim to empower users with tools to track their emotional well-being,
          connect with professionals, and access resources that promote mental wellness.
        </Text>
        <Text style={styles.paragraph}>
          At TranqHeal, we believe that everyone deserves to feel heard and supported. Our app combines the latest
          advancements in machine learning and data analysis to deliver meaningful insights and suggestions tailored
          to each user. Whether you're seeking mood tracking, professional connections, or simply a way to
          understand your emotions better, we're here to help.
        </Text>
        <Text style={styles.paragraph}>
          Thank you for choosing TranqHeal as your partner in mental health. Together, let's create a healthier,
          happier future.
        </Text>
        <Text style={styles.paragraph}>
          Contact Us: app.tranqheal@gmail.com
        </Text>
      </ScrollView>
    </RootLayout>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    paddingBottom: 40,
    backgroundColor: '#ffffff',
  },
  heading: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  paragraph: {
    fontSize: 16,
    lineHeight: 24,
    color: '#555',
    marginBottom: 15,
  },
});
