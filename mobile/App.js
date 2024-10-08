import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { RootNavigator }  from './src/navigation';
import { AuthenticatedUserProvider } from '@shared/providers';

const App = () => {
  return (
    <AuthenticatedUserProvider>
      <SafeAreaProvider>
        <RootNavigator />
      </SafeAreaProvider>
    </AuthenticatedUserProvider>
  );
};

export default App;