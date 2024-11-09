import * as React from 'react';
import { createStackNavigator } from '@react-navigation/stack';

import { HomeScreen, SAScreen, ForumsScreen, ViewProfScreen, ForumPostScreen, PostDetailsScreen, ViewOrgScreen, MoodScreen,
     ProfileScreen, NotificationScreen, MenuScreen, EditProfileScreen, ProfessionalDetailsScreen, OrganizationDetailsScreen,
     SAPreferenceScreen, SAScreen2, SAScreen3, SAResultScreen, MoodMeterScreen, MoodScreen2, MoodResultScreen,
     SeekProfessionalScreen, MoodLogsScreen, MatchingScreen
 } from '../screens';

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
                options={{ headerShown: false }} // Show the header for ForumsScreen
            />
            <Stack.Screen 
                name="ViewProfessionals" 
                component={ViewProfScreen} 
                options={{ headerShown: false }} // Show the header for ViewProfessionalsScreen
            />
            <Stack.Screen 
                name="ForumDetails" 
                component={ForumPostScreen} 
                options={{ headerShown: false }} // Show the header for ViewOrganizationsScreen
            />
            <Stack.Screen 
                name="PostDetails" 
                component={PostDetailsScreen} 
                options={{ headerShown: false }} // Show the header for ViewOrganizationsScreen
            />
            <Stack.Screen 
                name="ViewOrganizations" 
                component={ViewOrgScreen} 
                options={{ headerShown: false }} // Show the header for ViewOrganizationsScreen
            />
            <Stack.Screen 
                name="Mood" 
                component={MoodScreen} 
                options={{ headerShown: false }}
            /> 
            <Stack.Screen 
                name="Profile" 
                component={ProfileScreen} 
                options={{ headerShown: false }} 
            /> 
            <Stack.Screen 
                name="Menu" 
                component={MenuScreen} 
                options={{ headerShown: false }}
            /> 
            <Stack.Screen 
                name="Notifications" 
                component={NotificationScreen} 
                options={{ headerShown: false }}
            /> 
            <Stack.Screen 
                name="EditProfile" 
                component={EditProfileScreen}
                options={{ headerShown: false }}
            />
            <Stack.Screen
                name="ProfessionalDetails"
                component={ProfessionalDetailsScreen}
                options={{ headerShown: false }}
            />
            <Stack.Screen
                name="OrganizationDetails"
                component={OrganizationDetailsScreen}
                options={{ headerShown: false }}
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
            <Stack.Screen 
                name="Matching" 
                component={MatchingScreen} 
                options={{ headerShown: false }} 
            />
            <Stack.Screen 
                name="MoodMeter" 
                component={MoodMeterScreen} 
                options={{ headerShown: false }} 
            />
            <Stack.Screen 
                name="Mood2" 
                component={MoodScreen2} 
                options={{ headerShown: false }} 
            />
            <Stack.Screen 
                name="MoodResult" 
                component={MoodResultScreen} 
                options={{ headerShown: false }} 
            />
            <Stack.Screen 
                name="SeekProfessional" 
                component={SeekProfessionalScreen} 
                options={{ headerShown: false }} 
            />
            <Stack.Screen 
                name="MoodLogs" 
                component={MoodLogsScreen} 
                options={{ headerShown: false }} 
            />
        </Stack.Navigator>
    );
}