// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBpamVdu-H-wGQ6BeTZmmsZCCs-1HY4grs",
  authDomain: "ristasetu.firebaseapp.com",
  projectId: "ristasetu",
  storageBucket: "ristasetu.firebasestorage.app",
  messagingSenderId: "609598874094",
  appId: "1:609598874094:web:3c80d5dbd1c47e4e42aeff",
  measurementId: "G-V9LXTM8GVB"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);

export { app, analytics, auth, db };
