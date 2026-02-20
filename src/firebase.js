// Import the functions you need from the SDKs you need
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyA2Nd-IPdlKmTNyljYchzsxF7IWNIboJg8",
  authDomain: "runner-79aeb.firebaseapp.com",
  projectId: "runner-79aeb",
  storageBucket: "runner-79aeb.firebasestorage.app",
  messagingSenderId: "699853687568",
  appId: "1:699853687568:web:bb745858f16709b6ad3395",
  measurementId: "G-EDF96S5EDD"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);

export { analytics, app, auth, db };
