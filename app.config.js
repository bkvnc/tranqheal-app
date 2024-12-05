import "dotenv/config";
import { version } from "react";

export default {
  expo: {
    name: "TranqHeal",
    slug: "tranqheal-mobile",
    owner: "bkvnc",
    scheme: "myapp",
    platforms: ["android"],
    version: "1.0.0",
    orientation: "portrait",
    icon: "./src/assets/tranqheal-logo.png",
    userInterfaceStyle: "light",
    splash: {
      image: "./src/assets/small-logo.jpg",
      resizeMode: "contain",
      backgroundColor: "#FFFFFF",
    },
    updates: {
      fallbackToCacheTimeout: 0,
    },
    assetBundlePatterns: [
      "assets/**/*",
    ],
    ios: {
      supportsTablet: true,
    },
    extra: {
      apiKey: process.env.API_KEY,
      authDomain: process.env.AUTH_DOMAIN,
      projectId: process.env.PROJECT_ID,
      storageBucket: process.env.STORAGE_BUCKET,
      messagingSenderId: process.env.MESSAGING_SENDER_ID,
      appId: process.env.APP_ID,
      eas: {
        projectId: "ebfe0542-9061-4c3c-9fc2-d675974ff5d6",
      },
      webClientId: "388083674825-so3c1k6k42e4uccc633v47mmoiu5fb4u.apps.googleusercontent.com",
      redirectUri: "https://auth.expo.io/@bkvnc/tranqheal-mobile",
    },
    android: {
      permissions: ["READ_EXTERNAL_STORAGE", "WRITE_EXTERNAL_STORAGE", "INTERNET", "CAMERA"],
      package: "com.tranqheal.app",
      versionCode: 1,
    },
    "newArchEnabled": true,
    "minify": false
  },
};
