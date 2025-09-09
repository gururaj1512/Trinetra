// Firebase configuration and initialization for Trinetra
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBDFani8FVoBi3_LdeOn4TKSLApCus0zuI",
  authDomain: "trinetra-12e7c.firebaseapp.com",
  projectId: "trinetra-12e7c",
  storageBucket: "trinetra-12e7c.firebasestorage.app",
  messagingSenderId: "904671937646",
  appId: "1:904671937646:web:3025486ecea88f8dd8527f",
  measurementId: "G-D7X0Z9S54Y"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Auth and Firestore
const auth = getAuth(app);
const db = getFirestore(app);

// Enable offline persistence for Firestore
// enableIndexedDbPersistence(db).catch((err) => {
//   if (err.code === 'failed-precondition') {
//     // Multiple tabs open, persistence can only be enabled in one tab at a time
//   } else if (err.code === 'unimplemented') {
//     // The current browser does not support all of the features required
//   }
// });

export { auth, db };
