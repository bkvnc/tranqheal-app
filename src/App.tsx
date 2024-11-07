import { Suspense, lazy, useEffect, useState } from 'react';
import { Route, Routes, useNavigate } from 'react-router-dom';
import { toast, ToastContainer } from "react-toastify";
import SignIn from './pages/Authentication/SignIn';
import SignUp from './pages/Authentication/SignUp';
import Loader from './common/Loader';
import routes from './routes';
import Dashboard from './pages/Dashboard/Home';
import { auth } from './config/firebase';
import 'tailwindcss/tailwind.css';
import { onMessage } from "firebase/messaging";
import { messaging } from "./config/firebase";
import { getToken } from 'firebase/messaging';
import Message from "./components/Messaage";
import { saveTokenToFirestore } from './service/fcmService';
import "react-toastify/dist/ReactToastify.css";

const DefaultLayout = lazy(() => import('./layout/DefaultLayout'));

function App() {
  const [loading, setLoading] = useState<boolean>(true);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const navigate = useNavigate();

  // const requestPermission = async () => {
  //   const permission = Notification.permission;

  //   if (permission === 'default') {
  //     const userPermission = await Notification.requestPermission();
  //     if (userPermission === 'granted') {
  //       const token = await getToken(messaging, {
  //         vapidKey: 'YOUR_VAPID_KEY', // Replace with your VAPID key
  //       });

  //       if (token) {
  //         console.log('FCM Token generated:', token);
  //         // Save the token to Firestore (pass the correct userId and userType)
  //         saveTokenToFirestore('userId', token, 'userType');
  //       }
  //     } else {
  //       console.log('Notification permission denied');
  //     }
  //   } else if (permission === 'denied') {
  //     console.log('Notifications are blocked');
  //   }
  // };

  // useEffect(() => {
  //   requestPermission();
  // }, []);


  useEffect(() => {
    const checkAuth = () => {
      const user = auth.currentUser;
      if (user) {
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
        navigate('/auth/signin');
      }
    };

    setTimeout(() => {
      setLoading(false);
      checkAuth();
    }, 1000);
  }, [navigate]);

  useEffect(() => {
    const unsubscribe = onMessage(messaging, (payload) => {
      toast(<Message notification={payload.notification} />);
    });
    return unsubscribe;
  }, []);

  if (loading) {
    return <Loader />;
  }

  return (
    <>
      <ToastContainer />
        <Routes>
          <Route path="/auth/signin" element={<SignIn />} />
          <Route path="/auth/signup" element={<SignUp />} />
          {isAuthenticated ? (
            <Route element={<DefaultLayout />}>
              <Route index element={<Dashboard />} />
              {routes.map((route, index) => {
                const { path, component: Component } = route;
                return (
                  <Route
                    key={index}
                    path={path}
                    element={
                      <Suspense fallback={<Loader />}>
                        <Component />
                      </Suspense>
                    }
                  />
                );
              })}
            </Route>
          ) : (
            <Route path="*" element={<SignIn />} />
          )}
        </Routes>
    </>
  );
}

export default App;