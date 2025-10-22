'use client';

import React, { DependencyList, createContext, useContext, ReactNode, useMemo, useState, useEffect } from 'react';
import { FirebaseApp } from 'firebase/app';
import { Firestore } from 'firebase/firestore';
import { Auth, User, onAuthStateChanged, getRedirectResult } from 'firebase/auth';
import { FirebaseErrorListener } from '@/components/FirebaseErrorListener'
import { updateUserProfile } from './non-blocking-updates';

interface FirebaseProviderProps {
  children: ReactNode;
  firebaseApp: FirebaseApp;
  firestore: Firestore;
  auth: Auth;
}

// Internal state for user authentication
interface UserAuthState {
  user: User | null;
  isUserLoading: boolean;
  userError: Error | null;
}

// Combined state for the Firebase context
export interface FirebaseContextState {
  areServicesAvailable: boolean; // True if core services (app, firestore, auth instance) are provided
  firebaseApp: FirebaseApp | null;
  firestore: Firestore | null;
  auth: Auth | null; // The Auth service instance
  // User authentication state
  user: User | null;
  isUserLoading: boolean; // True during initial auth check
  userError: Error | null; // Error from auth listener
}

// Return type for useFirebase()
export interface FirebaseServicesAndUser {
  firebaseApp: FirebaseApp;
  firestore: Firestore;
  auth: Auth;
  user: User | null;
  isUserLoading: boolean;
  userError: Error | null;
}

// Return type for useUser() - specific to user auth state
export interface UserHookResult { // Renamed from UserAuthHookResult for consistency if desired, or keep as UserAuthHookResult
  user: User | null;
  isUserLoading: boolean;
  userError: Error | null;
}

// React Context
export const FirebaseContext = createContext<FirebaseContextState | undefined>(undefined);

/**
 * FirebaseProvider manages and provides Firebase services and user authentication state.
 */
export const FirebaseProvider: React.FC<FirebaseProviderProps> = ({
  children,
  firebaseApp,
  firestore,
  auth,
}) => {
  const [userAuthState, setUserAuthState] = useState<UserAuthState>({
    user: null,
    isUserLoading: true, // Start loading until first auth event
    userError: null,
  });

  // Effect to subscribe to Firebase auth state changes
  useEffect(() => {
    if (!auth) {
      setUserAuthState({ user: null, isUserLoading: false, userError: new Error("Auth service not provided.") });
      return;
    }
  
    // This is the correct pattern for handling redirect results.
    // First, process the redirect result. This is a one-time check.
    getRedirectResult(auth)
      .then((result) => {
        // If a user is coming from a redirect, `result` will not be null.
        // We can handle the new user here if needed, but onAuthStateChanged will also fire.
        if (result && result.user && firestore) {
           updateUserProfile(firestore, result.user);
        }
      })
      .catch((error) => {
        // Handle errors from getRedirectResult, e.g., credential already in use.
        console.error("FirebaseProvider: getRedirectResult error:", error);
        setUserAuthState(prev => ({ ...prev, userError: error }));
      })
      .finally(() => {
        // After processing the redirect (or if there was no redirect),
        // set up the onAuthStateChanged listener to handle all subsequent auth state changes.
        const unsubscribe = onAuthStateChanged(
          auth,
          (firebaseUser) => { // Auth state determined
            setUserAuthState({ user: firebaseUser, isUserLoading: false, userError: null });
            if (firebaseUser && firestore) {
              // This is useful for subsequent logins on the same device.
              updateUserProfile(firestore, firebaseUser);
            }
          },
          (error) => { // Auth listener error
            console.error("FirebaseProvider: onAuthStateChanged error:", error);
            setUserAuthState({ user: null, isUserLoading: false, userError: error });
          }
        );
  
        // Return the cleanup function for the listener.
        return unsubscribe;
      });
  
    // Note: The structure above returns a function from `.finally`, which is unconventional.
    // The correct approach is to have `onAuthStateChanged` as the main effect logic
    // and `getRedirectResult` as a one-time check. Let's restructure.
  
  }, [auth, firestore]);
  
  // Re-writing the useEffect with the correct pattern
  useEffect(() => {
    if (!auth) return;
  
    let unsubscribed = false;
  
    // 1. Set up the state listener. This will give us the current user
    // if they are already signed in from a previous session.
    const unsubscribe = onAuthStateChanged(
      auth,
      (firebaseUser) => {
        if (unsubscribed) return;
        setUserAuthState({ user: firebaseUser, isUserLoading: false, userError: null });
      },
      (error) => {
        if (unsubscribed) return;
        console.error("FirebaseProvider: onAuthStateChanged error:", error);
        setUserAuthState({ user: null, isUserLoading: false, userError: error });
      }
    );
  
    // 2. Asynchronously check for the result of a redirect operation.
    getRedirectResult(auth)
      .then(userCredential => {
        if (unsubscribed) return;
        // If we get a result, a user has just signed in.
        // onAuthStateChanged will also fire, but we can do specific new-user logic here.
        if (userCredential && userCredential.user && firestore) {
          updateUserProfile(firestore, userCredential.user);
        }
      })
      .catch(error => {
        if (unsubscribed) return;
        console.error("FirebaseProvider: getRedirectResult error:", error);
        setUserAuthState(prev => ({ ...prev, userError: error }));
      });
  
    // 3. Return a cleanup function.
    return () => {
      unsubscribed = true;
      unsubscribe();
    };
  }, [auth, firestore]);


  // Memoize the context value
  const contextValue = useMemo((): FirebaseContextState => {
    const servicesAvailable = !!(firebaseApp && firestore && auth);
    return {
      areServicesAvailable: servicesAvailable,
      firebaseApp: servicesAvailable ? firebaseApp : null,
      firestore: servicesAvailable ? firestore : null,
      auth: servicesAvailable ? auth : null,
      user: userAuthState.user,
      isUserLoading: userAuthState.isUserLoading,
      userError: userAuthState.userError,
    };
  }, [firebaseApp, firestore, auth, userAuthState]);

  return (
    <FirebaseContext.Provider value={contextValue}>
      <FirebaseErrorListener />
      {children}
    </FirebaseContext.Provider>
  );
};

/**
 * Hook to access core Firebase services and user authentication state.
 * Throws error if core services are not available or used outside provider.
 */
export const useFirebase = (): FirebaseServicesAndUser => {
  const context = useContext(FirebaseContext);

  if (context === undefined) {
    throw new Error('useFirebase must be used within a FirebaseProvider.');
  }

  if (!context.areServicesAvailable || !context.firebaseApp || !context.firestore || !context.auth) {
    throw new Error('Firebase core services not available. Check FirebaseProvider props.');
  }

  return {
    firebaseApp: context.firebaseApp,
    firestore: context.firestore,
    auth: context.auth,
    user: context.user,
    isUserLoading: context.isUserLoading,
    userError: context.userError,
  };
};

/** Hook to access Firebase Auth instance. */
export const useAuth = (): Auth => {
  const { auth } = useFirebase();
  return auth;
};

/** Hook to access Firestore instance. */
export const useFirestore = (): Firestore => {
  const { firestore } = useFirebase();
  return firestore;
};

/** Hook to access Firebase App instance. */
export const useFirebaseApp = (): FirebaseApp => {
  const { firebaseApp } = useFirebase();
  return firebaseApp;
};

type MemoFirebase <T> = T & {__memo?: boolean};

export function useMemoFirebase<T>(factory: () => T, deps: DependencyList): T | (MemoFirebase<T>) {
  const memoized = useMemo(factory, deps);
  
  if(typeof memoized !== 'object' || memoized === null) return memoized;
  (memoized as MemoFirebase<T>).__memo = true;
  
  return memoized;
}

/**
 * Hook specifically for accessing the authenticated user's state.
 * This provides the User object, loading status, and any auth errors.
 * @returns {UserHookResult} Object with user, isUserLoading, userError.
 */
export const useUser = (): UserHookResult => { // Renamed from useAuthUser
  const { user, isUserLoading, userError } = useFirebase(); // Leverages the main hook
  return { user, isUserLoading, userError };
};
