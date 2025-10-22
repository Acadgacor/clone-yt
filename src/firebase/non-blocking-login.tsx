'use client';
import {
  Auth,
  signInWithRedirect,
  GoogleAuthProvider,
  signOut
} from 'firebase/auth';

/** Initiate Google sign-in (non-blocking). */
export function initiateGoogleSignIn(authInstance: Auth): void {
  const provider = new GoogleAuthProvider();
  // CRITICAL: Call signInWithRedirect directly. Do NOT use 'await'.
  signInWithRedirect(authInstance, provider);
  // Firebase handles the redirect result on page load.
}

/** Initiate sign-out (non-blocking). */
export function initiateSignOut(authInstance: Auth): void {
    // CRITICAL: Call signOut directly. Do NOT use 'await'.
    signOut(authInstance);
    // Auth state change is handled by onAuthStateChanged listener.
}
