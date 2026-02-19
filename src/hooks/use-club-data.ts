'use client';
// src/hooks/use-club-data.ts
// Drop-in replacement for mock data imports in clubs/[id]/page.tsx

import { collection, doc, query, orderBy } from 'firebase/firestore';
import { useFirestore, useDoc, useCollection, useMemoFirebase } from '@/firebase';

export function useClubData(clubId: string) {
  const firestore = useFirestore();

  // ── Club document ─────────────────────────────────────────────────────────
  const clubRef = useMemoFirebase(
    () => doc(firestore, 'clubs', clubId),
    [firestore, clubId]
  );
  const { data: club, isLoading: isClubLoading } = useDoc(clubRef);

  // ── Members subcollection ─────────────────────────────────────────────────
  const membersRef = useMemoFirebase(
    () => collection(firestore, 'clubs', clubId, 'members'),
    [firestore, clubId]
  );
  const { data: members = [], isLoading: isMembersLoading } = useCollection(membersRef);

  // ── Discussions subcollection ─────────────────────────────────────────────
  const discussionsQuery = useMemoFirebase(
    () =>
      query(
        collection(firestore, 'clubs', clubId, 'discussions'),
        orderBy('createdAt', 'desc')
      ),
    [firestore, clubId]
  );
  const { data: discussions = [], isLoading: isDiscussionsLoading } =
    useCollection(discussionsQuery);

  const isLoading = isClubLoading || isMembersLoading || isDiscussionsLoading;

  // Split discussions by type (mirrors original helper functions)
  const generalDiscussions = discussions.filter(
    d => d.type === 'general' || d.type === 'check-in'
  );
  const bookDiscussions = discussions.filter(d => d.type === 'book-specific');
  const thematicDiscussions = discussions.filter(d => d.type === 'thematic');

  return {
    club,
    members,
    discussions,
    generalDiscussions,
    bookDiscussions,
    thematicDiscussions,
    isLoading,
  };
}