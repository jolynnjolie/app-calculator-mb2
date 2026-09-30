// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAnalytics, isSupported } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-analytics.js";
import {
  getFirestore,
  collection,
  addDoc,
  setDoc,
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

const COLLECTION_HISTORY = "calc_history";
const COLLECTION_USERS = "active_users";
const MAX_HISTORY = 10;

/**
 * Gets or creates a persistent device ID for this browser
 */
export function getDeviceId() {
  let id = localStorage.getItem("calc_device_id");
  if (!id) {
    id = "dev_" + Math.random().toString(36).substring(2, 10);
    localStorage.setItem("calc_device_id", id);
  }
  return id;
}

/**
 * Generates an informative human-readable label with device & browser type
 */
export function getDeviceLabel() {
  const ua = navigator.userAgent;
  let os = "Desktop";
  let icon = "💻";

  if (/iphone/i.test(ua)) {
    os = "iPhone";
    icon = "📱";
  } else if (/ipad/i.test(ua)) {
    os = "iPad";
    icon = "📱";
  } else if (/android/i.test(ua)) {
    os = "Android";
    icon = "📱";
  } else if (/macintosh|mac os x/i.test(ua)) {
    os = "Mac";
    icon = "💻";
  } else if (/windows/i.test(ua)) {
    os = "Windows";
    icon = "💻";
  } else if (/linux/i.test(ua)) {
    os = "Linux";
    icon = "💻";
  }

  let browser = "";
  if (/edg/i.test(ua)) browser = "Edge";
  else if (/chrome/i.test(ua)) browser = "Chrome";
  else if (/firefox/i.test(ua)) browser = "Firefox";
  else if (/safari/i.test(ua)) browser = "Safari";

  return `${icon} ${os}${browser ? ' • ' + browser : ''}`;
}

/**
 * Prunes Firestore documents so only the latest MAX_HISTORY records exist.
 */
async function pruneOldRecords() {
  try {
    const qAll = query(collection(db, COLLECTION_HISTORY), orderBy("timestamp", "desc"));
    const snapAll = await getDocs(qAll);
    if (snapAll.size > MAX_HISTORY) {
      const docsToDelete = snapAll.docs.slice(MAX_HISTORY);
      for (const d of docsToDelete) {
        await deleteDoc(doc(db, COLLECTION_HISTORY, d.id));
      }
    }
  } catch (err) {
    console.warn("Gagal memotong riwayat lama di Firestore:", err);
  }
}

/**
 * Saves a calculation record to Firestore with device info and ensures max 10 records are kept.
 */
export async function saveCalculationToCloud(expression, result) {
  try {
    const timestamp = Date.now();
    const timeStr = new Date(timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const item = {
      expr: expression,
      res: result,
      time: timeStr,
      device: getDeviceLabel(),
      deviceId: getDeviceId(),
      timestamp: timestamp
    };
    await addDoc(collection(db, COLLECTION_HISTORY), item);
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
    const snap = await getDocs(collection(db, COLLECTION_HISTORY));
    const deletes = snap.docs.map((d) => deleteDoc(doc(db, COLLECTION_HISTORY, d.id)));
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
      collection(db, COLLECTION_HISTORY),
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
            device: data.device || "💻 Perangkat Lain",
            deviceId: data.deviceId || "",
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

/**
 * Tracks real-time active users across all devices.
 */
export function initPresenceTracking(onActiveUsersChange) {
  const deviceId = getDeviceId();
  const deviceLabel = getDeviceLabel();

  // Send initial and recurring heartbeats
  const sendHeartbeat = async () => {
    try {
      await setDoc(doc(db, COLLECTION_USERS, deviceId), {
        deviceId,
        deviceLabel,
        lastSeen: Date.now()
      }, { merge: true });
    } catch (e) {
      // presence error handled safely
    }
  };

  sendHeartbeat();
  const heartbeatTimer = setInterval(sendHeartbeat, 20000);

  // Remove presence on window unload/pagehide
  const removePresence = () => {
    try {
      deleteDoc(doc(db, COLLECTION_USERS, deviceId)).catch(() => {});
    } catch (e) {}
  };
  window.addEventListener("beforeunload", removePresence);
  window.addEventListener("pagehide", removePresence);

  // Listen to all active users
  try {
    const unsubscribe = onSnapshot(collection(db, COLLECTION_USERS), (snapshot) => {
      const now = Date.now();
      const activeList = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        // Considered online if heartbeat received in last 45 seconds
        if (data.lastSeen && (now - data.lastSeen < 45000)) {
          activeList.push({
            id: docSnap.id,
            label: data.deviceLabel || "📱 Perangkat",
            isSelf: docSnap.id === deviceId,
            lastSeen: data.lastSeen
          });
        }
      });
      if (typeof onActiveUsersChange === "function") {
        onActiveUsersChange(activeList);
      }
    }, (err) => {
      console.warn("Presence snapshot warning:", err);
    });

    return () => {
      clearInterval(heartbeatTimer);
      unsubscribe();
    };
  } catch (err) {
    console.warn("Presence init warning:", err);
    return () => clearInterval(heartbeatTimer);
  }
}

// Expose globally on window for easy access from main calculator script
window.firebaseSync = {
  app,
  db,
  saveCalculationToCloud,
  clearCloudHistory,
  subscribeToHistory,
  initPresenceTracking,
  getDeviceId,
  getDeviceLabel,
  config: firebaseConfig,
  isLive: false
};

// Dispatch event notifying that Firebase service is ready
window.dispatchEvent(new CustomEvent("firebase-ready", { detail: window.firebaseSync }));
