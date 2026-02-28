'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { initializeFirestore, Firestore } from 'firebase/firestore';

export interface FirebaseSdks {
  firebaseApp: FirebaseApp;
  auth: Auth;
  firestore: Firestore;
}

/**
 * Initializes Firebase services and returns the SDK instances.
 * This is designed to be idempotent and safe to call multiple times.
 * Uses experimentalForceLongPolling to bypass potential network blocks in some environments.
 */
export function initializeFirebase(): FirebaseSdks {
  const firebaseApp = getApps().length === 0 
    ? initializeApp(firebaseConfig) 
    : getApp();

  const auth = getAuth(firebaseApp);
  
  // Use initializeFirestore instead of getFirestore to provide custom settings
  const firestore = initializeFirestore(firebaseApp, {
    experimentalForceLongPolling: true,
  });

  return {
    firebaseApp,
    auth,
    firestore,
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
