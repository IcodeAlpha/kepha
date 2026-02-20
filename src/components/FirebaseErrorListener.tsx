'use client';

import { useEffect } from 'react';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

/**
 * An invisible component that listens for globally emitted 'permission-error' events.
 * Logs errors to the console for debugging but never crashes the app.
 */
export function FirebaseErrorListener() {
  useEffect(() => {
    const handleError = (err: FirestorePermissionError) => {
      // Log for debugging but never crash the app on permission errors
      console.warn('[Firestore] Permission error:', err.message);
    };

    errorEmitter.on('permission-error', handleError);
    return () => {
      errorEmitter.off('permission-error', handleError);
    };
  }, []);

  return null;
}