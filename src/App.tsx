import { Suspense, lazy, useEffect, useState } from 'react';
import { Route, Routes, useNavigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import SignIn from './pages/Authentication/SignIn';
import SignUp from './pages/Authentication/SignUp';
import Loader from './common/Loader';
import routes from './routes';
import Dasboard from './pages/Dashboard/Home';
import { auth } from './config/firebase'; 
import 'tailwindcss/tailwind.css';
import { auth } from './config/firebase'; // Assuming Firebase has auth setup

const DefaultLayout = lazy(() => import('./layout/DefaultLayout'));

function App() {
  const [loading, setLoading] = useState<boolean>(true);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Simulate loading and check authentication status
    const checkAuth = () => {
      const user = auth.currentUser;
      if (user) {
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
        navigate('/auth/signin'); // Redirect to sign-in page if not authenticated
      }
    };

    setTimeout(() => {
      setLoading(false);
      checkAuth();
    }, 1000);
  }, [navigate]);

  if (loading) {
    return <Loader />;
  }

  return (
    <>
      <Toaster
        position="top-right"
        reverseOrder={false}
        containerClassName="overflow-auto"
      />
      <Routes>
        <Route path="/auth/signin" element={<SignIn />} />
        <Route path="/auth/signup" element={<SignUp />} />
        {isAuthenticated ? (
          <Route element={<DefaultLayout />}>
            <Route index element={<Dasboard />} />
            {routes.map((routes, index) => {
              const { path, component: Component } = routes;
              return (
                <Route
                  key={index}
                  path={path}
                  element={
                    <Suspense fallback={<Loader />}>
                      <Component/>
                    </Suspense>
                  }
                />
              );
            })}
          </Route>
        ) : (
          <Route path="*" element={<SignIn />} /> // Redirect to Signin if not authenticated
        )}
      </Routes>
    </>
  );
}

export default App;
