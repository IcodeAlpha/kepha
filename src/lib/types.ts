// Core Types for Kepha - Cozy Reading Communities

export type ReadingStatus = 'reading' | 'finished' | 'want-to-read' | 'dnf';
export type BookFormat = 'physical' | 'ebook' | 'audiobook' | 'in-app';
export type DiscussionType = 'book-specific' | 'general' | 'thematic' | 'check-in';

// User
export interface User {
  name: string;
  avatarUrl: string;
  bio?: string;
  favoriteGenres?: string[];
  readingStyle?: string; // "fast reader", "slow and steady", "mood reader"
}

// Book
export interface Book {
  id: string;
  title: string;
  author: string;
  coverUrl: string;
  coverHint: string;
  summary: string;
  genre?: string;
  pageCount?: number;
  chapters?: Chapter[];
  uploadedBy?: string; // userId who added it to platform
}

// Chapter
export interface Chapter {
  id: string;
  title: string;
  chapterNumber: number;
  content: string;
  pageStart?: number;
  pageEnd?: number;
}

// User's Personal Bookshelf Entry
export interface UserBook {
  id: string;
  userId: string;
  bookId: string;
  format: BookFormat;
  status: ReadingStatus;
  currentPage?: number;
  currentChapter?: number;
  progressPercent: number;
  startedAt?: string;
  finishedAt?: string;
  rating?: number; // 1-5
  review?: string;
  isPrivate?: boolean; // hide from club view
}

// Club - Now a community, not tied to one book!
export interface Club {
  id: string;
  name: string;
  description: string;
  vibe: string; // "cozy mysteries", "fantasy lovers", "just book friends"
  isPublic: boolean;
  memberIds: string[];
  ownerId: string;
  theme?: string; // optional genre preference
  rules?: string[];
  coverImage?: string;
  createdAt: string;
}

// Club Member Details
export interface ClubMember {
  userId: string;
  clubId: string;
  currentlyReading?: {
    bookId: string;
    startedAt: string;
    progressPercent: number;
  };
  joinedAt: string;
  role: 'owner' | 'moderator' | 'member';
  readingBuddyId?: string;
  isOnline?: boolean; // for presence
  lastSeen?: string;
}

// Discussion (can be book-specific OR general club chat)
export interface Discussion {
  id: string;
  clubId: string;
  type: DiscussionType;
  title: string;
  description?: string;
  bookId?: string; // only for book-specific discussions
  chapterId?: string; // only for chapter discussions
  createdBy: string;
  createdAt: string;
  isPinned?: boolean;
  tags?: string[]; // "spoilers", "theory", "favorite-moment"
}

// Discussion Post
export interface DiscussionPost {
  id: string;
  discussionId?: string;
  userId: string;
  content: string;
  timestamp: string;
  replies?: DiscussionPost[];
  reactions?: { [emoji: string]: string[] }; // emoji -> array of userIds
  quotedText?: string; // quote from book
  spoilerWarning?: boolean;
  images?: string[];
}

// User Notes (private or shared)
export interface UserNote {
  id: string;
  userId: string;
  bookId: string;
  chapterId?: string;
  content: string;
  createdAt: string;
  isPublic: boolean; // can share with club
  pageNumber?: number;
}

// Reading Session (scheduled reading together)
export interface ReadingSession {
  id: string;
  clubId: string;
  scheduledFor: string;
  durationMinutes: number;
  title: string;
  description?: string;
  hostId: string;
  activeParticipants: string[]; // userIds currently in session
  chatMessages: ChatMessage[];
}

// Chat Message (for reading sessions or general club chat)
export interface ChatMessage {
  id: string;
  userId: string;
  content: string;
  timestamp: string;
  type: 'text' | 'image' | 'reaction';
  imageUrl?: string;
}

// Reading Activity (for feed)
export interface ReadingActivity {
  id: string;
  userId: string;
  clubId?: string;
  type: 'started-book' | 'finished-book' | 'finished-chapter' | 'shared-quote' | 'joined-club';
  bookId?: string;
  timestamp: string;
  content?: string; // for quotes or comments
}

// Thematic Discussion Topic (AI-generated cross-book discussions)
export interface ThematicTopic {
  id: string;
  clubId: string;
  theme: string; // "grief", "unreliable narrators", "redemption arcs"
  description: string;
  relatedBookIds: string[];
  generatedBy: 'ai' | 'member';
  createdAt: string;
}

// Recommendation
export interface Recommendation {
  bookId: string;
  reason: string;
  recommendedBy: 'ai' | string; // 'ai' or userId
  score?: number;
}