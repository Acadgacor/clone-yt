'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth, connectAuthEmulator } from 'firebase/auth';
import { initializeFirestore, Firestore, connectFirestoreEmulator } from 'firebase/firestore';

export interface FirebaseSdks {
  firebaseApp: FirebaseApp;
  auth: Auth;
  firestore: Firestore;
}

let isAuthEmulatorConnected = false;
let isFirestoreEmulatorConnected = false;

export function initializeFirebase(): FirebaseSdks {
  const firebaseApp = getApps().length === 0 
    ? initializeApp(firebaseConfig) 
    : getApp();

  const auth = getAuth(firebaseApp);

  const shouldUseAuthEmulator =
    process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === 'true' ||
    process.env.NODE_ENV === 'development';

  if (shouldUseAuthEmulator && !isAuthEmulatorConnected) {
    connectAuthEmulator(auth, 'http://127.0.0.1:19099');
    isAuthEmulatorConnected = true;
  }
  
  // Use initializeFirestore instead of getFirestore to provide custom settings
  const firestore = initializeFirestore(firebaseApp, {
    experimentalForceLongPolling: true,
  });

  if (shouldUseAuthEmulator && !isFirestoreEmulatorConnected) {
    connectFirestoreEmulator(firestore, '127.0.0.1', 18080);
    isFirestoreEmulatorConnected = true;
  }

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
