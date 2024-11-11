import * as React from 'react';
import { createStackNavigator } from '@react-navigation/stack';

import { HomeScreen, MenuScreen, NotificationScreen, ProfileScreen, EditProfileScreen,
    ViewProfScreen, ProfessionalDetailsScreen, ViewOrgScreen, OrganizationDetailsScreen,
    SAPreferenceScreen, SAScreen, SelfAssessmentLogs, SAScreen2, SAScreen3, SAResultScreen, 
    MoodScreen, MoodScreen2, MoodMeterScreen, MoodResultScreen, MoodLogsScreen, MatchingScreen, 
    SeekProfessionalScreen, 
} from '../screens';

import { ForumStack } from './ForumStack';

const Stack = createStackNavigator();

export const AppStack = () => {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen name="Menu" component={MenuScreen} />
            <Stack.Screen name="ForumMain" component={ForumStack} /> 
            <Stack.Screen name="Notifications" component={NotificationScreen} /> 
            <Stack.Screen name="Profile" component={ProfileScreen} /> 
            <Stack.Screen name="EditProfile" component={EditProfileScreen} />
            <Stack.Screen name="ViewProfessionals" component={ViewProfScreen} />
            <Stack.Screen name="ProfessionalDetails" component={ProfessionalDetailsScreen} />
            <Stack.Screen name="ViewOrganizations" component={ViewOrgScreen} />
            <Stack.Screen name="OrganizationDetails" component={OrganizationDetailsScreen} />
            <Stack.Screen name="Preferences" component={SAPreferenceScreen} />
            <Stack.Screen name="SelfAssessment" component={SAScreen} />
            <Stack.Screen name="SelfAssessmentLogs" component={SelfAssessmentLogs} />
            <Stack.Screen name="SelfAssessment2" component={SAScreen2} />
            <Stack.Screen name="SelfAssessment3" component={SAScreen3} />
            <Stack.Screen name="SelfAssessmentResult" component={SAResultScreen} />
            <Stack.Screen name="MoodMeter" component={MoodMeterScreen} /> 
            <Stack.Screen name="Mood" component={MoodScreen} />
            <Stack.Screen name="Mood2" component={MoodScreen2} />
            <Stack.Screen name="MoodResult" component={MoodResultScreen} />
            <Stack.Screen name="MoodLogs" component={MoodLogsScreen} />
            <Stack.Screen name="Matching" component={MatchingScreen} />
            <Stack.Screen name="SeekProfessional" component={SeekProfessionalScreen} />
        </Stack.Navigator>
    );
}