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
import { getToken, onMessage } from "firebase/messaging";
import { messaging } from "./config/firebase";
import Message from "./components/Messaage";
import "react-toastify/dist/ReactToastify.css";

const DefaultLayout = lazy(() => import('./layout/DefaultLayout'));

function App() {
  const [loading, setLoading] = useState<boolean>(true);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const navigate = useNavigate();

  async function requestPermission() {
    const permission = Notification.permission;
  
    if (permission === "default") {
      const userPermission = await Notification.requestPermission();
      if (userPermission === "granted") {
        const token = await getToken(messaging, {
          vapidKey: import.meta.env.VITE_APP_VAPID_KEY,
        });
        console.log("Token generated:", token);
      } else if (userPermission === "denied") {
        toast("You have denied notifications. Enable them in your browser settings.");
      }
    } else if (permission === "denied") {
      toast("Notifications are blocked. Please enable them in your browser settings.");
    }
  }

  useEffect(() => {
    requestPermission();
  }, []);

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
      <ToastContainer  />
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
