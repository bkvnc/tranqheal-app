import * as React from 'react';
import { createStackNavigator } from '@react-navigation/stack';

import { HomeScreen } from '../screens';
import { SAScreen } from '../screens';
import { ForumsScreen } from '../screens';
import { ViewProfScreen } from '../screens';
import { ViewOrgScreen } from '../screens';
import { MoodScreen } from '../screens';
import { ProfileScreen } from '../screens';
import { MenuScreen } from '../screens';
import { NotificationScreen } from '../screens';
import { SAPreferenceScreen } from '../screens';
import { SAResultScreen } from '../screens';
import { SAScreen2 }  from  '../screens';
import { SAScreen3 } from '../screens';

const Stack = createStackNavigator();

export const AppStack = () => {
    return (
        <Stack.Navigator>
            <Stack.Screen 
                name="Home" 
                component={HomeScreen} 
                options={{ headerShown: false }} // Hide the header for HomeScreen
            />
            <Stack.Screen 
                name="SelfAssessment" 
                component={SAScreen} 
                options={{ headerShown: false }} // Show the header for SelfAssessmentScreen
            />
            <Stack.Screen 
                name="Forums" 
                component={ForumsScreen} 
                options={{ headerShown: true }} // Show the header for ForumsScreen
            />
            <Stack.Screen 
                name="ViewProfessionals" 
                component={ViewProfScreen} 
                options={{ headerShown: true }} // Show the header for ViewProfessionalsScreen
            />
            <Stack.Screen 
                name="ViewOrganizations" 
                component={ViewOrgScreen} 
                options={{ headerShown: true }} // Show the header for ViewOrganizationsScreen
            />
            <Stack.Screen 
                name="Mood" 
                component={MoodScreen} 
                options={{ headerShown: true }} // Show the header for ViewOrganizationsScreen
            /> 
            <Stack.Screen 
                name="Profile" 
                component={ProfileScreen} 
                options={{ headerShown: true }} // Show the header for ViewOrganizationsScreen
            /> 
            <Stack.Screen 
                name="Menu" 
                component={MenuScreen} 
                options={{ headerShown: true }} // Show the header for ViewOrganizationsScreen
            /> 
            <Stack.Screen 
                name="Notifications" 
                component={NotificationScreen} 
                options={{ headerShown: true }} // Show the header for ViewOrganizationsScreen
            /> 
             <Stack.Screen 
                name="Preferences" 
                component={SAPreferenceScreen} 
                options={{ headerShown: false }}
            />
             <Stack.Screen 
                name="SelfAssessment2" 
                component={SAScreen2} 
                options={{ headerShown: false }} 
            />
            <Stack.Screen 
                name="SelfAssessment3" 
                component={SAScreen3} 
                options={{ headerShown: false }} 
            />
             <Stack.Screen 
                name="SelfAssessmentResult" 
                component={SAResultScreen} 
                options={{ headerShown: false }} 
            />
        </Stack.Navigator>
    );
}