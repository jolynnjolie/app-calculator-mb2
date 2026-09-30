// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAnalytics, isSupported } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-analytics.js";

// Your web app's Firebase configuration
export const firebaseConfig = {
  apiKey: "AIzaSyBNU12kzlSYcstEmtc_3lIDoELctddEx7I",
  authDomain: "mycalculator-d4709.firebaseapp.com",
  projectId: "mycalculator-d4709",
  storageBucket: "mycalculator-d4709.firebasestorage.app",
  messagingSenderId: "148478326311",
  appId: "1:148478326311:web:305a68ba0523b9ae2c4002"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);

// Initialize Analytics if supported in browser environment
export let analytics = null;
isSupported().then((supported) => {
  if (supported) {
    analytics = getAnalytics(app);
    console.log("Firebase Analytics aktif:", firebaseConfig.projectId);
  }
}).catch((err) => {
  console.log("Firebase Analytics tidak didukung di lingkungan ini:", err);
});

// Expose to window for global access
window.firebaseApp = app;
window.firebaseConfig = firebaseConfig;
console.log("Firebase terhubung:", firebaseConfig.projectId);
