'use client';

import { useState, useEffect } from 'react';
import {
  Query,
  onSnapshot,
  DocumentData,
  FirestoreError,
  QuerySnapshot,
  CollectionReference,
} from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

export type WithId<T> = T & { id: string };

export interface UseCollectionResult<T> {
  data: WithId<T>[] | null;
  isLoading: boolean;
  error: FirestoreError | Error | null;
}

export interface InternalQuery extends Query<DocumentData> {
  _query: {
    path: {
      canonicalString(): string;
      toString(): string;
    }
  }
}

export function useCollection<T = any>(
  memoizedTargetRefOrQuery: ((CollectionReference<DocumentData> | Query<DocumentData>) & { __memo?: boolean }) | null | undefined,
): UseCollectionResult<T> {
  type ResultItemType = WithId<T>;
  type StateDataType = ResultItemType[] | null;

  const [data, setData] = useState<StateDataType>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<FirestoreError | Error | null>(null);

  useEffect(() => {
    if (!memoizedTargetRefOrQuery) {
      setData(null);
      setIsLoading(false);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    let retryTimeout: ReturnType<typeof setTimeout> | null = null;
    let unsubscribe: (() => void) | null = null;

    const subscribe = () => {
      unsubscribe = onSnapshot(
        memoizedTargetRefOrQuery!,
        (snapshot: QuerySnapshot<DocumentData>) => {
          const results: ResultItemType[] = [];
          for (const doc of snapshot.docs) {
            results.push({ ...(doc.data() as T), id: doc.id });
          }
          setData(results);
          setError(null);
          setIsLoading(false);
        },
        (err: FirestoreError) => {
          const path: string =
            memoizedTargetRefOrQuery!.type === 'collection'
              ? (memoizedTargetRefOrQuery as CollectionReference).path
              : (memoizedTargetRefOrQuery as unknown as InternalQuery)._query.path.canonicalString();

          if (err.code === 'permission-denied') {
            // Could be an auth token race condition — retry once after a short delay
            // before treating it as a real error and crashing globally.
            retryTimeout = setTimeout(() => {
              if (unsubscribe) {
                unsubscribe();
                unsubscribe = null;
              }

              // Second attempt — if this also fails, emit globally
              unsubscribe = onSnapshot(
                memoizedTargetRefOrQuery!,
                (snapshot: QuerySnapshot<DocumentData>) => {
                  const results: ResultItemType[] = [];
                  for (const doc of snapshot.docs) {
                    results.push({ ...(doc.data() as T), id: doc.id });
                  }
                  setData(results);
                  setError(null);
                  setIsLoading(false);
                },
                (retryErr: FirestoreError) => {
                  // Still failing after retry — now it's a real permissions error
                  const contextualError = new FirestorePermissionError({
                    operation: 'list',
                    path,
                  });
                  setError(contextualError);
                  setData(null);
                  setIsLoading(false);
                  errorEmitter.emit('permission-error', contextualError);
                }
              );
            }, 1500); // wait 1.5s for auth token to propagate

            // Set local error state but don't crash globally yet
            setError(err);
            setData(null);
            setIsLoading(false);
          } else {
            // Non-permission error — fail immediately
            const contextualError = new FirestorePermissionError({
              operation: 'list',
              path,
            });
            setError(contextualError);
            setData(null);
            setIsLoading(false);
            errorEmitter.emit('permission-error', contextualError);
          }
        }
      );
    };

    subscribe();

    return () => {
      if (retryTimeout) clearTimeout(retryTimeout);
      if (unsubscribe) unsubscribe();
    };
  }, [memoizedTargetRefOrQuery]);

  if (memoizedTargetRefOrQuery && !memoizedTargetRefOrQuery.__memo) {
    throw new Error(memoizedTargetRefOrQuery + ' was not properly memoized using useMemoFirebase');
  }

  return { data, isLoading, error };
}