// Firebase Configuration & Initialization
const firebaseConfig = {
  apiKey: "AIzaSyBj5R7a9pdcWkv00kcslpjHruOE4jgaO4w",
  authDomain: "attendance-6e328.firebaseapp.com",
  projectId: "attendance-6e328",
  storageBucket: "attendance-6e328.firebasestorage.app",
  messagingSenderId: "51486826427",
  appId: "1:51486826427:web:1c917a7c96ef198b992e9e",
  measurementId: "G-28K124JLQC"
};

// Initialize Firebase using compat SDK for script tag inclusion
if (typeof firebase !== 'undefined') {
  if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
  }
}
