export type User = {
  id: string;
  name: string;
  avatarUrl: string;
};

export type DiscussionPost = {
  id: string;
  userId: string;
  content: string;
  timestamp: string;
  replies: DiscussionPost[];
};

export type Chapter = {
  id: string;
  title: string;
  chapterNumber: number;
  content: string;
  discussion: DiscussionPost[];
};

export type Book = {
  id: string;
  title: string;
  author: string;
  coverUrl: string;
  coverHint: string;
  summary: string;
  chapters: Chapter[];
};

export type Club = {
  id: string;
  name: string;
  description: string;
  isPublic: boolean;
  bookId: string;
  memberIds: string[];
};
