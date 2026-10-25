import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

const apiKey = import.meta.env.VITE_FIREBASE_API_KEY;
const authDomain = import.meta.env.VITE_FIREBASE_AUTH_DOMAIN;
const projectId =
  import.meta.env.VITE_FIREBASE_PROJECT_ID ||
  (authDomain && !authDomain.includes('demo') ? authDomain.split('.')[0] : '');
const storageBucket = import.meta.env.VITE_FIREBASE_STORAGE_BUCKET;
const messagingSenderId = import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID;
const appId = import.meta.env.VITE_FIREBASE_APP_ID;

const firebaseConfig = {
  apiKey: apiKey || 'demo-api-key',
  authDomain: authDomain || 'demo.firebaseapp.com',
  projectId: projectId || 'demo-project',
  storageBucket: storageBucket || 'demo.appspot.com',
  messagingSenderId: messagingSenderId || '1234567890',
  appId: appId || '1:1234567890:web:abcdef',
};

// Initialize Firebase safely
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Initialize Firebase Authentication
export const firebaseAuth = getAuth(app);

// Google Auth Provider
export const googleProvider = new GoogleAuthProvider();

export const isFirebaseConfigured = Boolean(apiKey && apiKey !== 'demo-api-key');

export default app;
