'use client';
// src/hooks/use-dashboard-data.ts
// Drop-in replacement for the mock data imports in dashboard/page.tsx

import { collection, query, where, orderBy, limit, doc } from 'firebase/firestore';
import { useFirestore, useUser, useDoc, useCollection, useMemoFirebase } from '@/firebase';

export function useDashboardData() {
  const firestore = useFirestore();
  const { user } = useUser();
  const uid = user?.uid ?? null;

  // ── Current user profile (/users/{uid}) ─────────────────────────────────
  const userRef = useMemoFirebase(
    () => (uid ? doc(firestore, 'users', uid) : null),
    [firestore, uid]
  );
  const { data: userProfile, isLoading: isProfileLoading } = useDoc(userRef);

  // ── My clubs (clubs where I'm a member) ──────────────────────────────────
  const myClubsQuery = useMemoFirebase(
    () =>
      uid
        ? query(
            collection(firestore, 'clubs'),
            where('memberIds', 'array-contains', uid)
          )
        : null,
    [firestore, uid]
  );
  const { data: myClubs = [], isLoading: isClubsLoading } = useCollection(myClubsQuery);

  // ── Currently reading books ───────────────────────────────────────────────
  const readingQuery = useMemoFirebase(
    () =>
      uid
        ? query(
            collection(firestore, 'userBooks'),
            where('userId', '==', uid),
            where('status', '==', 'reading')
          )
        : null,
    [firestore, uid]
  );
  const { data: currentlyReading = [], isLoading: isReadingLoading } =
    useCollection(readingQuery);

  // ── Finished books ────────────────────────────────────────────────────────
  const finishedQuery = useMemoFirebase(
    () =>
      uid
        ? query(
            collection(firestore, 'userBooks'),
            where('userId', '==', uid),
            where('status', '==', 'finished'),
            orderBy('finishedAt', 'desc')
          )
        : null,
    [firestore, uid]
  );
  const { data: finishedBooks = [], isLoading: isFinishedLoading } =
    useCollection(finishedQuery);

  // ── Activity feed (from my clubs) ─────────────────────────────────────────
  // Firestore 'in' operator supports max 10 values
  const clubIds = myClubs.map(c => c.id).slice(0, 10);
  const activityQuery = useMemoFirebase(
    () =>
      clubIds.length > 0
        ? query(
            collection(firestore, 'readingActivities'),
            where('clubId', 'in', clubIds),
            orderBy('timestamp', 'desc'),
            limit(20)
          )
        : null,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [firestore, clubIds.join(',')]
  );
  const { data: activities = [], isLoading: isActivitiesLoading } =
    useCollection(activityQuery);

  const isLoading =
    isProfileLoading || isClubsLoading || isReadingLoading || isFinishedLoading;

  return {
    userProfile,
    myClubs,
    currentlyReading,
    finishedBooks,
    activities,
    isLoading,
  };
}