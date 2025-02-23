import React, { useState, useContext, useEffect} from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

import { AuthStack } from "./AuthStack";
import { AppStack } from "./AppStack";
import { ProfessionalStack } from "./ProfessionalStack";
import { AuthenticatedUserContext } from "../providers";
import { LoadingIndicator } from "../components";
import { auth, firestore } from "../config";
import { UploadCredentialsScreen } from "../screens";

const navigationRef = React.createRef();
const RootStack = createStackNavigator();

export const RootNavigator = () => {
    const { user, setUser, userType, setUserType } = useContext(AuthenticatedUserContext);
    const [isLoading, setIsLoading] = useState(true);
    const [isNewProfessional, setIsNewProfessional] = useState(false);
  
    useEffect(() => {
      const unsubscribeAuthStateChanged = onAuthStateChanged(auth, async (authenticatedUser) => {
        setIsLoading(true);
        try {
          if (authenticatedUser) {
            await authenticatedUser.reload();
            const userId = authenticatedUser.uid;
    
            const userDocRef = doc(firestore, "users", userId);
            const profDocRef = doc(firestore, "professionals", userId);
    
            const userDoc = await getDoc(userDocRef);
            const profDoc = await getDoc(profDocRef);
    
            if (!authenticatedUser.emailVerified) {
              if (userDoc.exists() && userDoc.data().emailStatus !== "Unverified") {
                await updateDoc(userDocRef, { emailStatus: "Unverified" });
              }
              setUser(null); 
              setUserType(null);
              setIsLoading(false);
              return;
            }
    
            if (userDoc.exists() && userDoc.data().emailStatus !== "Verified") {
              await updateDoc(userDocRef, { emailStatus: "Verified" });
            }
    
            setUser(authenticatedUser);
    
            if (userDoc.exists()) {
              setUserType("user");
            } else if (profDoc.exists()) {
              const profData = profDoc.data();
              setUserType("professional");
              setIsNewProfessional(profData.isNew || false);
            } else {
              setUserType(null);
            }
          } else {
            setUser(null);
            setUserType(null);
            setIsNewProfessional(false);
          }
        } catch (error) {
          console.error("Error during auth state change:", error);
        } finally {
          setIsLoading(false); 
        }
      });
    
      return unsubscribeAuthStateChanged;
    }, [setUser, setUserType]);    

    if (isLoading) {
      return <LoadingIndicator />;
    }
  
    return (
      <NavigationContainer ref={navigationRef}>
        <RootStack.Navigator screenOptions={{ headerShown: false }}>
          {!user ? (
            <RootStack.Screen name="Auth" component={AuthStack} />
          ) : userType === "user" ? (
            <RootStack.Screen name="App" component={AppStack} />
          ) : userType === "professional" && isNewProfessional ? (
            <RootStack.Screen name="Auth" component={AuthStack} />
          ) : userType === "professional" && !isNewProfessional ? (
            <RootStack.Screen name="Professional" component={ProfessionalStack} />
          ) : (
            <RootStack.Screen name="Auth" component={AuthStack} />
          )}
          {/* Adding UploadCredentials here */}
          <RootStack.Screen name="UploadCredentials" component={UploadCredentialsScreen} />
        </RootStack.Navigator>
      </NavigationContainer>
    );
  };
  