'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore'

let firebaseApp: FirebaseApp | undefined;
let auth: Auth | undefined;
let firestore: Firestore | undefined;

// This function is guaranteed to be idempotent.
function initializeFirebaseSDKs() {
    if (firebaseApp) {
        return { firebaseApp, auth: auth!, firestore: firestore! };
    }

    if (getApps().length > 0) {
        firebaseApp = getApp();
    } else {
        try {
            // This will use the Firebase Hosting config if available
            firebaseApp = initializeApp();
        } catch (e) {
            if (process.env.NODE_ENV === "production") {
                console.warn('Automatic Firebase initialization failed, falling back to firebaseConfig.', e);
            }
            firebaseApp = initializeApp(firebaseConfig);
        }
    }
    
    auth = getAuth(firebaseApp);
    firestore = getFirestore(firebaseApp);

    return { firebaseApp, auth, firestore };
}


// IMPORTANT: DO NOT MODIFY THIS FUNCTION
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