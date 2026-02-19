'use client';
// src/lib/firestore-writes.ts
// All Firestore write operations for the app — import these in your components

import {
  collection,
  doc,
  arrayUnion,
  arrayRemove,
  serverTimestamp,
} from 'firebase/firestore';
import type { Firestore } from 'firebase/firestore';
import {
  addDocumentNonBlocking,
  updateDocumentNonBlocking,
  setDocumentNonBlocking,
} from '@/firebase';
import type { BookFormat, ReadingActivity } from '@/lib/types';

// ── Reading Shelf ─────────────────────────────────────────────────────────────

export function addBookToShelf(
  firestore: Firestore,
  userId: string,
  bookId: string,
  format: BookFormat
) {
  addDocumentNonBlocking(collection(firestore, 'userBooks'), {
    userId,               // MUST match security rule: isOwner(request.resource.data.userId)
    bookId,
    format,
    status: 'reading',
    progressPercent: 0,
    currentPage: 0,
    startedAt: serverTimestamp(),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export function updateReadingProgress(
  firestore: Firestore,
  userBookId: string,
  currentPage: number,
  pageCount: number
) {
  updateDocumentNonBlocking(doc(firestore, 'userBooks', userBookId), {
    currentPage,
    progressPercent: Math.min(100, Math.round((currentPage / pageCount) * 100)),
    updatedAt: serverTimestamp(),
  });
}

export function markBookFinished(
  firestore: Firestore,
  userBookId: string,
  rating?: number
) {
  updateDocumentNonBlocking(doc(firestore, 'userBooks', userBookId), {
    status: 'finished',
    progressPercent: 100,
    finishedAt: serverTimestamp(),
    ...(rating !== undefined && { rating }),
    updatedAt: serverTimestamp(),
  });
}

// ── Clubs ─────────────────────────────────────────────────────────────────────

export function joinClub(
  firestore: Firestore,
  userId: string,
  clubId: string
) {
  // 1. Add UID to the club's memberIds array
  updateDocumentNonBlocking(doc(firestore, 'clubs', clubId), {
    memberIds: arrayUnion(userId),
  });

  // 2. Create the /clubs/{clubId}/members/{userId} document
  setDocumentNonBlocking(
    doc(firestore, 'clubs', clubId, 'members', userId),
    {
      userId,
      role: 'member',
      isOnline: false,
      lastSeen: serverTimestamp(),
      joinedAt: serverTimestamp(),
    },
    { merge: false }
  );

  // 3. Post a joined-club activity to the feed
  postActivity(firestore, userId, 'joined-club', { clubId });
}

export function leaveClub(
  firestore: Firestore,
  userId: string,
  clubId: string
) {
  updateDocumentNonBlocking(doc(firestore, 'clubs', clubId), {
    memberIds: arrayRemove(userId),
  });
}

export function createClub(
  firestore: Firestore,
  userId: string,
  data: {
    name: string;
    description: string;
    vibe: string;
    isPublic: boolean;
    theme?: string;
  }
) {
  // Slugify the name for the document ID
  const id = data.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

  setDocumentNonBlocking(
    doc(firestore, 'clubs', id),
    {
      ...data,
      ownerId: userId,
      memberIds: [userId],
      createdAt: serverTimestamp(),
    },
    { merge: false }
  );

  // Also add the owner as the first member
  setDocumentNonBlocking(
    doc(firestore, 'clubs', id, 'members', userId),
    {
      userId,
      role: 'owner',
      isOnline: true,
      lastSeen: serverTimestamp(),
      joinedAt: serverTimestamp(),
    },
    { merge: false }
  );

  return id; // return the club ID so the caller can redirect
}

// ── Club member currently reading ─────────────────────────────────────────────

export function updateMemberCurrentlyReading(
  firestore: Firestore,
  userId: string,
  clubId: string,
  bookId: string,
  progressPercent: number
) {
  updateDocumentNonBlocking(
    doc(firestore, 'clubs', clubId, 'members', userId),
    {
      currentlyReading: {
        bookId,
        progressPercent,
        startedAt: serverTimestamp(),
      },
      updatedAt: serverTimestamp(),
    }
  );
}

// ── Activity Feed ─────────────────────────────────────────────────────────────

export function postActivity(
  firestore: Firestore,
  userId: string,
  type: ReadingActivity['type'],
  options: { bookId?: string; clubId?: string; content?: string } = {}
) {
  addDocumentNonBlocking(collection(firestore, 'readingActivities'), {
    userId,
    type,
    bookId: options.bookId ?? null,
    clubId: options.clubId ?? null,
    content: options.content ?? null,
    timestamp: serverTimestamp(),
  });
}

// ── User Profile ──────────────────────────────────────────────────────────────

export function updateUserProfile(
  firestore: Firestore,
  userId: string,
  data: {
    name?: string;
    bio?: string;
    favoriteGenres?: string[];
    readingStyle?: string;
    avatarUrl?: string;
  }
) {
  updateDocumentNonBlocking(doc(firestore, 'users', userId), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

// ── Discussions ───────────────────────────────────────────────────────────────

export function createDiscussion(
  firestore: Firestore,
  userId: string,
  clubId: string,
  data: {
    title: string;
    type: 'book-specific' | 'general' | 'thematic' | 'check-in';
    description?: string;
    bookId?: string;
    tags?: string[];
  }
) {
  addDocumentNonBlocking(collection(firestore, 'clubs', clubId, 'discussions'), {
    ...data,
    clubId,
    createdBy: userId,
    createdAt: serverTimestamp(),
    isPinned: false,
  });
}