/* ============================================================
   FIREBASE CONFIG — Vendora-sn
   ⚠️ REMPLACEZ ces valeurs par celles de votre projet Firebase
   Guide : https://console.firebase.google.com
   ============================================================ */
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, doc, getDocs, getDoc, addDoc, updateDoc, deleteDoc, query, where, orderBy } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-storage.js";

// 🔴 REMPLACEZ CES VALEURS PAR CELLES DE VOTRE PROJET FIREBASE
const firebaseConfig = {
  apiKey: "VOTRE_API_KEY",
  authDomain: "VOTRE_PROJECT.firebaseapp.com",
  projectId: "VOTRE_PROJECT_ID",
  storageBucket: "VOTRE_PROJECT.appspot.com",
  messagingSenderId: "VOTRE_SENDER_ID",
  appId: "VOTRE_APP_ID"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const storage = getStorage(app);
export { collection, doc, getDocs, getDoc, addDoc, updateDoc, deleteDoc, query, where, orderBy, ref, uploadBytes, getDownloadURL };
