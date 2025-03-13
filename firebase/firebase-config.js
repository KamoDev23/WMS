// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBP2WQYJ29pRObxfbW7JzLbxJGnnAjoz5g",
  authDomain: "workshop-management-syst-cf785.firebaseapp.com",
  projectId: "workshop-management-syst-cf785",
  storageBucket: "workshop-management-syst-cf785.firebasestorage.app",
  messagingSenderId: "815849099005",
  appId: "1:815849099005:web:fba0ffd9e3e9b368c5b894"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore and Storage
export const db = getFirestore(app);
export const storage = getStorage(app);
export const auth = getAuth(app);