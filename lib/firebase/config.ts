import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import {
  getAuth,
  GoogleAuthProvider,
  setPersistence,
  browserLocalPersistence,
} from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCKEG-VqAZRGyEpSsPIxeJV5ACZ8mfQvPY",
  authDomain: "monthlygrow-cb74d.firebaseapp.com",
  projectId: "monthlygrow-cb74d",
  storageBucket: "monthlygrow-cb74d.firebasestorage.app",
  messagingSenderId: "960277815712",
  appId: "1:960277815712:web:38f547540231380e0fc4c5",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
export const db = getFirestore(app);

// Initialize Auth
export const auth = getAuth(app);
export const googleAuthProvider = new GoogleAuthProvider();

// Initialize Storage
export const storage = getStorage(app);

// Set persistence to LOCAL (localStorage)
setPersistence(auth, browserLocalPersistence).catch((error) => {
  console.error("Firebase Auth persistence configuration failed:", error);
});
