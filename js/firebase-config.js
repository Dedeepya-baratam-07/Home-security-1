/**
 * Home Security App — Firebase Configuration, Auth & Firestore Initialization
 * Web SDK Version: 12.19.0 (Modular CDN)
 * Project ID: homesecurity-75a2e
 */

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js";
import { 
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyC1M-V-F_dgcCFglEn3MXoy7Y8gxrL1TAA",
  authDomain: "homesecurity-75a2e.firebaseapp.com",
  projectId: "homesecurity-75a2e",
  storageBucket: "homesecurity-75a2e.firebasestorage.app",
  messagingSenderId: "563939210147",
  appId: "1:563939210147:web:34610f6a0ce1f18259e016",
  measurementId: "G-P06FGT7NQC"
};

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication
const auth = getAuth(app);

// Initialize Cloud Firestore
const db = getFirestore(app);

// Safe global reference for debugging
window.__firebase = { app, auth, db, config: firebaseConfig };
console.log("Firebase initialized successfully with project:", firebaseConfig.projectId);

export { 
  app, 
  auth,
  db,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence
};