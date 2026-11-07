// PIXORA Firebase Production Configuration
// Project: pixora-7dc8f
import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAnalytics, isSupported } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-analytics.js";
import { getAuth, GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

export const firebaseConfig = {
  apiKey: "AIzaSyAETe6XVOekxxp77cWJafSqJVNR70qzbpE",
  authDomain: "pixora-7dc8f.firebaseapp.com",
  projectId: "pixora-7dc8f",
  storageBucket: "pixora-7dc8f.firebasestorage.app",
  messagingSenderId: "221600400260",
  appId: "1:221600400260:web:98450bf56be66b46c613d1",
  measurementId: "G-7B2V7VDSWP"
};

// Initialize Firebase App singleton
export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// Auth & Providers
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Analytics with safety check (for environments without localStorage / cookies)
export let analytics = null;
isSupported().then(supported => {
  if (supported) {
    analytics = getAnalytics(app);
    console.log("[PIXORA] Firebase Analytics initialized (G-7B2V7VDSWP)");
  }
}).catch(() => {
  // Graceful fallback if analytics not supported in private mode
});

// Expose to window for vanilla JS access across pages
if (typeof window !== "undefined") {
  window.PixoraFirebase = {
    app,
    auth,
    googleProvider,
    config: firebaseConfig
  };
}
