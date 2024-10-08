import React, { useState, createContext } from 'react';

export const AuthenticatedUserContext = createContext({});

export const AuthenticatedUserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userType, setUserType] = useState(null);

  return (
    <AuthenticatedUserContext.Provider value={{ user, setUser, userType, setUserType }}>
      {children}
    </AuthenticatedUserContext.Provider>
  );
};
