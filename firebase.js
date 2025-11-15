// Import the functions you need from the SDKs you need
import { getAnalytics } from "firebase/analytics";
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyC--7GTundq-_g9EBFIY0v30LVevCuoLEg",
  authDomain: "skinsight-5f746.firebaseapp.com",
  projectId: "skinsight-5f746",
  storageBucket: "skinsight-5f746.firebasestorage.app",
  messagingSenderId: "278426790898",
  appId: "1:278426790898:web:022f336c7b80256795596b",
  measurementId: "G-ME6NB05EMP"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Analytics only works on web, so wrap in try-catch for React Native
let analytics = null;
try {
  if (typeof window !== 'undefined') {
    analytics = getAnalytics(app);
  }
} catch (error) {
  console.log('Analytics not available:', error);
}

export { analytics, app, auth, db };

