'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';

/**
 * Robust Firebase initialization for Next.js.
 * Ensures the app is only initialized once and always with the config object.
 * Explicit initialization prevents 'app/no-options' errors during Vercel builds.
 */
function getFirebaseServices() {
  let app: FirebaseApp;
  
  if (getApps().length > 0) {
    app = getApp();
  } else {
    // Explicitly passing config here prevents errors during static generation
    app = initializeApp(firebaseConfig);
  }

  return {
    firebaseApp: app,
    auth: getAuth(app),
    firestore: getFirestore(app),
  };
}

const { firebaseApp, auth, firestore } = getFirebaseServices();

export { firebaseApp, auth, firestore };

// Primary entry point for SDK initialization
export function initializeFirebase() {
  return { firebaseApp, auth, firestore };
}

export function getSdks(app: FirebaseApp) {
  return {
    firebaseApp: app,
    auth: getAuth(app),
    firestore: getFirestore(app)
  };
}

export * from './provider';
export * from './client-provider';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './non-blocking-updates';
export * from './non-blocking-login';
export * from './errors';
export * from './error-emitter';
