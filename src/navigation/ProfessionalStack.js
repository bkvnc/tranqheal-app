import * as React from 'react';
import { createStackNavigator } from '@react-navigation/stack';

import { ProfessionalHomeScreen, MenuScreen, NotificationScreen, 
    ProfessionalProfileScreen, EditProfessionalProfileScreen, 
    ViewRequestScreen, ViewRequestHistoryScreen, ViewOrgScreen, 
    OrganizationDetailsScreen, ViewAcceptedRequestsScreen, AboutUs
} from '../screens';




import { ForumStack } from './ForumStack';

const Stack = createStackNavigator();

export const ProfessionalStack = () => {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="ProfessionalHome" component={ProfessionalHomeScreen} />
            <Stack.Screen name="Menu" component={MenuScreen} />
            <Stack.Screen name="AboutUs" component={AboutUs} />
            <Stack.Screen name="ForumMain" component={ForumStack} />
            <Stack.Screen name="Notifications" component={NotificationScreen} /> 
            <Stack.Screen name='ProfessionalProfile' component={ProfessionalProfileScreen} />
            <Stack.Screen name='EditProfessionalProfile' component={EditProfessionalProfileScreen} />
            <Stack.Screen name="ViewRequest" component={ViewRequestScreen} />
            <Stack.Screen name="ViewRequestHistory" component={ViewRequestHistoryScreen} />
            <Stack.Screen name="ViewOrganizations" component={ViewOrgScreen} />
            <Stack.Screen name="OrganizationDetails" component={OrganizationDetailsScreen} />
            <Stack.Screen name="ViewAcceptedRequests" component={ViewAcceptedRequestsScreen} />
        </Stack.Navigator>
    );
}