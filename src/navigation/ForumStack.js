import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';

import { ForumsScreen, ForumPostScreen, PostDetailsScreen } from '../screens';

const Stack = createStackNavigator();

export const ForumStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Forums" component={ForumsScreen} />
    <Stack.Screen name="ForumDetails" component={ForumPostScreen} />
    <Stack.Screen name="PostDetails" component={PostDetailsScreen} />
  </Stack.Navigator>
);
