'use client';
    
import { useState, useEffect } from 'react';
import {
  DocumentReference,
  onSnapshot,
  DocumentData,
  FirestoreError,
  DocumentSnapshot,
} from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

type WithId<T> = T & { id: string };

export interface UseDocResult<T> {
  data: WithId<T> | null;
  isLoading: boolean;
  error: FirestoreError | Error | null;
}

export function useDoc<T = any>(
  memoizedDocRef: DocumentReference<DocumentData> | null | undefined,
): UseDocResult<T> {
  type StateDataType = WithId<T> | null;

  const [data, setData] = useState<StateDataType>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<FirestoreError | Error | null>(null);

  useEffect(() => {
    if (!memoizedDocRef) {
      setData(null);
      setIsLoading(false);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    let retryTimeout: ReturnType<typeof setTimeout> | null = null;
    let unsubscribe: (() => void) | null = null;

    const subscribe = (isRetry = false) => {
      unsubscribe = onSnapshot(
        memoizedDocRef,
        (snapshot: DocumentSnapshot<DocumentData>) => {
          if (snapshot.exists()) {
            setData({ ...(snapshot.data() as T), id: snapshot.id });
          } else {
            setData(null);
          }
          setError(null);
          setIsLoading(false);
        },
        (err: FirestoreError) => {
          const contextualError = new FirestorePermissionError({
            operation: 'get',
            path: memoizedDocRef.path,
          });

          if (err.code === 'permission-denied' && !isRetry) {
            // Auth token may not have propagated yet — retry after a short delay
            setError(err);
            setData(null);
            setIsLoading(false);

            retryTimeout = setTimeout(() => {
              if (unsubscribe) {
                unsubscribe();
                unsubscribe = null;
              }
              subscribe(true); // retry once
            }, 1500);
          } else {
            // Real error — either not permission-denied, or retry also failed
            setError(contextualError);
            setData(null);
            setIsLoading(false);

            // Only crash globally if it's not a permission error
            // Permission errors on user profile docs are often just auth race conditions
            if (err.code !== 'permission-denied') {
              errorEmitter.emit('permission-error', contextualError);
            }
          }
        }
      );
    };

    subscribe();

    return () => {
      if (retryTimeout) clearTimeout(retryTimeout);
      if (unsubscribe) unsubscribe();
    };
  }, [memoizedDocRef]);

  return { data, isLoading, error };
}