/**
 * SÓ AMIZADE — Firebase Web SDK via CDN (Modular v11+)
 * Utilizável diretamente em páginas HTML ou CDNs sem necessidade de bundler.
 */
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-app.js";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  sendEmailVerification,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/11.4.0/firebase-auth.js";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  query,
  where,
  orderBy,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/11.4.0/firebase-firestore.js";

export const firebaseConfig = {
  projectId: "gen-lang-client-0767997957",
  appId: "1:615861836486:web:8674e98a2037872e9c95c7",
  apiKey: "AIzaSyAd1sd7R7MVbwwBotTi3l0BLfsT8RbrDAk",
  authDomain: "gen-lang-client-0767997957.firebaseapp.com",
  firestoreDatabaseId: "ai-studio-samizade-c3a2be3d-4378-48e6-8afd-dc9fa1106e7a",
  storageBucket: "gen-lang-client-0767997957.firebasestorage.app",
  messagingSenderId: "615861836486"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" });

export {
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  sendEmailVerification,
  onAuthStateChanged,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  query,
  where,
  orderBy,
  onSnapshot
};
