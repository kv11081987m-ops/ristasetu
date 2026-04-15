import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "ristasetu.firebaseapp.com",
  projectId: "ristasetu",
  storageBucket: "ristasetu.firebasestorage.app",
  messagingSenderId: "609598874094",
  appId: "1:609598874094:web:3c80d5dbd1c47e4e42aeff",
  measurementId: "G-V9LXTM8GVB"
};

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
