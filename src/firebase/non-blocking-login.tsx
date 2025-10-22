'use client';
import {
  Auth,
  signInWithPopup,
  GoogleAuthProvider,
  signOut
} from 'firebase/auth';

/** Initiate Google sign-in (non-blocking). */
export function initiateGoogleSignIn(authInstance: Auth): void {
  const provider = new GoogleAuthProvider();
  // CRITICAL: Call signInWithPopup directly. Do NOT use 'await'.
  signInWithPopup(authInstance, provider);
  // Auth state change is handled by onAuthStateChanged listener.
}

/** Initiate sign-out (non-blocking). */
export function initiateSignOut(authInstance: Auth): void {
    // CRITICAL: Call signOut directly. Do NOT use 'await'.
    signOut(authInstance);
    // Auth state change is handled by onAuthStateChanged listener.
}
