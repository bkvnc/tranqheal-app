import * as React from 'react';
import { createStackNavigator } from '@react-navigation/stack';

import { WelcomeScreen, RegisterAsScreen, LoginScreen, SignupScreen } from '../screens';

const Stack = createStackNavigator();

export const AuthStack = () => {
    return (
        <Stack.Navigator
            initialRouteName="Welcome"
            screenOptions={{ headerShown: false }}
        >
            <Stack.Screen name="Welcome" component={WelcomeScreen} />
            <Stack.Screen name="RegisterAs" component={RegisterAsScreen} />
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Signup" component={SignupScreen} initialParams={{ userType: 'seeker' }} />
        </Stack.Navigator>
    );
}