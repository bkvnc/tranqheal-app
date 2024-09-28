import React, { useState, useContext, useEffect} from "react";
import { NavigationContainer } from "@react-navigation/native";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

import { AuthStack } from "./AuthStack";
import { AppStack } from "./AppStack";
import { ProfessionalStack } from "./ProfessionalStack";
import { AuthenticatedUserContext } from "../providers";
import { LoadingIndicator } from "../components";
import { auth, firestore } from "../config";

export const RootNavigator = () => {
    const { user, setUser } = useContext(AuthenticatedUserContext);
    const [ userType, setUserType ] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
  
    useEffect(() => {
      // onAuthStateChanged returns an unsubscriber
      const unsubscribeAuthStateChanged = onAuthStateChanged(auth, async (authenticatedUser) => {
        if (authenticatedUser) {
          setUser(authenticatedUser);

          const userId = authenticatedUser.uid;
          const userDocRef = doc(firestore, "users", userId);
          const profDocRef = doc(firestore, "professionals", userId);

          const userDoc = await getDoc(userDocRef);
          const profDoc = await getDoc(profDocRef);

          if (userDoc.exists()) {
            setUserType("user");
          } else if (profDoc.exists()) {
            setUserType("professional");
          } else {
            setUserType(null);
          }
        } else {
          setUser(null);
          setUserType(null);
        }

        setIsLoading(false);
      });
  
      // unsubscribe auth listener on unmount
      return unsubscribeAuthStateChanged;
    }, [user]);
  
    if (isLoading) {
      return <LoadingIndicator />;
    }
  
    return (
      <NavigationContainer>
        {!user ? (
          <AuthStack/> 
        ) : userType === "user" ? (
          <AppStack/>
        ) : userType === "professional" ? (
          <ProfessionalStack/>
        ) : (
          <AuthStack/>
        )}
      </NavigationContainer>
    );
  };
  