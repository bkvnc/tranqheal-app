
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { RootNavigator } from './src/navigation';
import { AuthenticatedUserProvider } from './src/providers';
import { NotificationProvider } from 'src/components/NotificationContext';

const App = () => {

  return (
    
    <AuthenticatedUserProvider>
      <SafeAreaProvider>
        <NotificationProvider>  
        <RootNavigator />
        </NotificationProvider>
      </SafeAreaProvider>
    </AuthenticatedUserProvider>
  );
};

export default App;
