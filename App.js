import React, { useEffect, useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AccessibilityInfo } from 'react-native'; // Import AccessibilityInfo
import { RootNavigator } from './src/navigation';
import { AuthenticatedUserProvider } from './src/providers';

const App = () => {
  const [reducedMotionEnabled, setReducedMotionEnabled] = useState(false);

  useEffect(() => {
    // Check the system's reduced motion setting
    AccessibilityInfo.isReduceMotionEnabled().then((isEnabled) => {
      setReducedMotionEnabled(isEnabled);
    });
  }, []);

  // Optionally log the reducedMotion setting for debugging
  useEffect(() => {
    if (reducedMotionEnabled) {
      console.log('Reduced Motion is enabled on this device');
    } else {
      console.log('Reduced Motion is disabled on this device');
    }
  }, [reducedMotionEnabled]);

  return (
    <AuthenticatedUserProvider>
      <SafeAreaProvider>
        {/* Pass the reducedMotionEnabled state to your navigation or context providers as needed */}
        <RootNavigator reducedMotionEnabled={reducedMotionEnabled} />
      </SafeAreaProvider>
    </AuthenticatedUserProvider>
  );
};

export default App;
