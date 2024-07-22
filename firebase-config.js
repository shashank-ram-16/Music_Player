// firebase-config.js
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.6.8/firebase-app.js';
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'https://www.gstatic.com/firebasejs/9.6.8/firebase-auth.js';
import { getFirestore, collection, getDocs, getDoc, doc, setDoc } from 'https://www.gstatic.com/firebasejs/9.6.8/firebase-firestore.js';
import { getStorage, ref, uploadBytesResumable, getDownloadURL, listAll, deleteObject } from "https://www.gstatic.com/firebasejs/9.6.8/firebase-storage.js";

const firebaseConfig = {
  apiKey: "",
  authDomain: "",
  projectId: "",
  storageBucket: "",
  messagingSenderId: "",
  appId: "",
  measurementId: ""
};

const firebaseApp = initializeApp(firebaseConfig);

const db = getFirestore();
const auth = getAuth();
let UID;
window.addEventListener('DOMContentLoaded', (event) => {
  onAuthStateChanged(auth, (user) => {
    if (user) {
      UID = user.uid;
      
    }
  });
});

export { auth, db, firebaseApp };
