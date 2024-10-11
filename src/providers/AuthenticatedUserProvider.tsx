import React, { useState, createContext, ReactNode, Dispatch, SetStateAction } from 'react';

// Define the shape of the context data
interface AuthenticatedUserContextType {
  user: string | null;
  setUser: Dispatch<SetStateAction<string | null>>;
  userType: string | null;
  setUserType: Dispatch<SetStateAction<string | null>>;
}

// Create the context with default values
export const AuthenticatedUserContext = createContext<AuthenticatedUserContextType | undefined>(undefined);

// Define the provider props with explicit children type
interface AuthenticatedUserProviderProps {
  children: ReactNode; // Explicit type for children
}

export const AuthenticatedUserProvider: React.FC<AuthenticatedUserProviderProps> = ({ children }) => {
  const [user, setUser] = useState<string | null>(null);
  const [userType, setUserType] = useState<string | null>(null);

  return (
    <AuthenticatedUserContext.Provider value={{ user, setUser, userType, setUserType }}>
      {children}
    </AuthenticatedUserContext.Provider>
  );
};
