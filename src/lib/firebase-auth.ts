/**
 * Firebase Auth — the identity provider, and nothing else.
 *
 * Clinical and donor data do NOT pass through Firebase. The shared state
 * service (services/spine) is the single source of truth for units, requests,
 * incidents and the staff register, so no patient or donor record leaves the
 * country — the same principle the AI tier holds to. Firebase is confined to
 * authenticating an operator's session.
 *
 * A Firebase session is best-effort: the shared service has already authorised
 * the account before these are called, and the demonstration accounts a
 * reviewer signs in with are not Firebase users at all.
 */
import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut as fbSignOut,
  signInAnonymously,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updatePassword,
  sendPasswordResetEmail,
  onAuthStateChanged,
  type User as FirebaseUser
} from 'firebase/auth';
import rawConfig from '../../firebase-applet-config.json';

export const firebaseConfig = {
  apiKey: (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_FIREBASE_API_KEY) || rawConfig.apiKey,
  authDomain: (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_FIREBASE_AUTH_DOMAIN) || rawConfig.authDomain,
  projectId: (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_FIREBASE_PROJECT_ID) || rawConfig.projectId,
  appId: (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_FIREBASE_APP_ID) || rawConfig.appId
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export {
  signInWithPopup,
  fbSignOut,
  fbSignOut as signOut,
  signInAnonymously,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updatePassword,
  sendPasswordResetEmail,
  onAuthStateChanged
};
export type { FirebaseUser };
