import { initializeApp } from "firebase/app";
import { initializeAuth, getReactNativePersistence } from "firebase/auth";
import Constants from "expo-constants";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";


// add firebase config
const firebaseConfig = {
  apiKey: Constants.expoConfig?.extra?.apiKey,
  authDomain: Constants.expoConfig?.extra?.authDomain,
  projectId: Constants.expoConfig?.extra?.projectId,
  storageBucket: Constants.expoConfig?.extra?.storageBucket,
  messagingSenderId: Constants.expoConfig?.extra?.messagingSenderId,
  appId: Constants.expoConfig?.extra?.appId,
};

// initialize firebase
const app = initializeApp(firebaseConfig);
// initialize firestore
const firestore = getFirestore(app);
// initialize storage
const storage = getStorage(app);
// initialize auth; only for native platforms (Android and iOS)
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
})

export { auth, firestore, storage };