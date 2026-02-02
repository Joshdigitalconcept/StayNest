'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore'

let firebaseApp: FirebaseApp | undefined;
let auth: Auth | undefined;
let firestore: Firestore | undefined;

/**
 * Idempotent initialization of Firebase SDKs.
 * Ensures config is passed explicitly to avoid build-time errors.
 */
function initializeFirebaseSDKs() {
    if (firebaseApp && auth && firestore) {
        return { firebaseApp, auth, firestore };
    }

    const apps = getApps();
    if (apps.length > 0) {
        firebaseApp = apps[0];
    } else {
        // Explicitly pass config to prevent 'app/no-options' errors during SSR
        firebaseApp = initializeApp(firebaseConfig);
    }
    
    auth = getAuth(firebaseApp);
    firestore = getFirestore(firebaseApp);

    return { firebaseApp, auth, firestore };
}


// IMPORTANT: This function is the primary entry point for SDK initialization.
export function initializeFirebase() {
  return initializeFirebaseSDKs();
}

export function getSdks(firebaseApp: FirebaseApp) {
  return {
    firebaseApp,
    auth: getAuth(firebaseApp),
    firestore: getFirestore(firebaseApp)
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
