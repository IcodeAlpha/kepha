'use client';
// src/hooks/use-club-eligibility.ts

import { collection, query, where } from 'firebase/firestore';
import { useFirestore, useUser, useCollection, useMemoFirebase } from '@/firebase';

export interface ClubEligibility {
  isEligible: boolean;
  isLoading: boolean;
  requirements: {
    hasUploadedBook: boolean;
    hasFinishedBook: boolean;
    isClubMember: boolean;
  };
  unmetReasons: string[];
}

export function useClubEligibility(): ClubEligibility {
  const firestore = useFirestore();
  const { user } = useUser();
  const uid = user?.uid ?? null;

  // ── Any book on user's shelf (reading, want-to-read, finished) ────────────
  const anyBookQuery = useMemoFirebase(() => {
    if (!uid) return null;
    return query(
      collection(firestore, 'userBooks'),
      where('userId', '==', uid)
    );
  }, [firestore, uid]);
  const { data: anyBooks, isLoading: anyBooksLoading } = useCollection(anyBookQuery);

  // ── Finished books ────────────────────────────────────────────────────────
  const finishedBooksQuery = useMemoFirebase(() => {
    if (!uid) return null;
    return query(
      collection(firestore, 'userBooks'),
      where('userId', '==', uid),
      where('status', '==', 'finished')
    );
  }, [firestore, uid]);
  const { data: finishedBooks, isLoading: finishedLoading } = useCollection(finishedBooksQuery);

  // ── Clubs user is a member of ─────────────────────────────────────────────
  const clubsQuery = useMemoFirebase(() => {
    if (!uid) return null;
    return query(
      collection(firestore, 'clubs'),
      where('memberIds', 'array-contains', uid)
    );
  }, [firestore, uid]);
  const { data: clubs, isLoading: clubsLoading } = useCollection(clubsQuery);

  const isLoading = anyBooksLoading || finishedLoading || clubsLoading;

  const hasUploadedBook = (anyBooks?.length ?? 0) >= 1;
  const hasFinishedBook = (finishedBooks?.length ?? 0) >= 1;
  const isClubMember = (clubs?.length ?? 0) >= 1;

  const unmetReasons: string[] = [];
  if (!hasUploadedBook) unmetReasons.push('Add at least 1 book to your shelf');
  if (!hasFinishedBook) unmetReasons.push('Finish reading at least 1 book');
  if (!isClubMember) unmetReasons.push('Join at least 1 existing club first');

  const isEligible = !isLoading && hasUploadedBook && hasFinishedBook && isClubMember;

  return {
    isEligible,
    isLoading,
    requirements: { hasUploadedBook, hasFinishedBook, isClubMember },
    unmetReasons,
  };
}