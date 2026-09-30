// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAnalytics, isSupported } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-analytics.js";
import {
  getFirestore,
  collection,
  addDoc,
  query,
  orderBy,
  limit,
  onSnapshot,
  getDocs,
  deleteDoc,
  doc
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

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
export const db = getFirestore(app);

// Initialize Analytics if supported
export let analytics = null;
isSupported().then((supported) => {
  if (supported) {
    analytics = getAnalytics(app);
  }
}).catch(() => {});

const COLLECTION_NAME = "calc_history";
const MAX_HISTORY = 10;

/**
 * Prunes Firestore documents so only the latest MAX_HISTORY records exist.
 */
async function pruneOldRecords() {
  try {
    const qAll = query(collection(db, COLLECTION_NAME), orderBy("timestamp", "desc"));
    const snapAll = await getDocs(qAll);
    if (snapAll.size > MAX_HISTORY) {
      const docsToDelete = snapAll.docs.slice(MAX_HISTORY);
      for (const d of docsToDelete) {
        await deleteDoc(doc(db, COLLECTION_NAME, d.id));
      }
    }
  } catch (err) {
    console.warn("Gagal memotong riwayat lama di Firestore:", err);
  }
}

/**
 * Saves a calculation record to Firestore and ensures max 10 records are kept.
 */
export async function saveCalculationToCloud(expression, result) {
  try {
    const timestamp = Date.now();
    const timeStr = new Date(timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const item = {
      expr: expression,
      res: result,
      time: timeStr,
      timestamp: timestamp
    };
    await addDoc(collection(db, COLLECTION_NAME), item);
    pruneOldRecords();
    return true;
  } catch (err) {
    console.warn("Gagal menyimpan ke Firestore:", err);
    return false;
  }
}

/**
 * Clears all calculation history from Firestore.
 */
export async function clearCloudHistory() {
  try {
    const snap = await getDocs(collection(db, COLLECTION_NAME));
    const deletes = snap.docs.map((d) => deleteDoc(doc(db, COLLECTION_NAME, d.id)));
    await Promise.all(deletes);
    return true;
  } catch (err) {
    console.warn("Gagal menghapus riwayat di Firestore:", err);
    return false;
  }
}

/**
 * Subscribes to real-time history updates from Firestore (limited to 10 latest).
 */
export function subscribeToHistory(onUpdate, onError) {
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      orderBy("timestamp", "desc"),
      limit(MAX_HISTORY)
    );

    return onSnapshot(
      q,
      (snapshot) => {
        const records = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          records.push({
            id: docSnap.id,
            expr: data.expr,
            res: data.res,
            time: data.time || new Date(data.timestamp || Date.now()).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            timestamp: data.timestamp || 0
          });
        });
        if (typeof onUpdate === "function") {
          onUpdate(records);
        }
      },
      (err) => {
        console.warn("Firestore onSnapshot error:", err);
        if (typeof onError === "function") {
          onError(err);
        }
      }
    );
  } catch (err) {
    console.warn("Gagal membuat subscription Firestore:", err);
    if (typeof onError === "function") onError(err);
    return () => {};
  }
}

// Expose globally on window for easy access from main calculator script
window.firebaseSync = {
  app,
  db,
  saveCalculationToCloud,
  clearCloudHistory,
  subscribeToHistory,
  config: firebaseConfig,
  isLive: false
};

// Dispatch event notifying that Firebase service is ready
window.dispatchEvent(new CustomEvent("firebase-ready", { detail: window.firebaseSync }));
