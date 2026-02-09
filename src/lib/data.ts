import type { 
  User, 
  Book, 
  Club, 
  ClubMember, 
  UserBook, 
  Chapter, 
  DiscussionPost,
  Discussion,
  ReadingActivity,
  ReadingSession,
  ChatMessage
} from './types';

// Users
export const users: (User & { id: string })[] = [
  { 
    id: 'user-1', 
    name: 'Alex Rivera', 
    avatarUrl: 'https://picsum.photos/seed/user-1/100/100',
    bio: 'Fantasy lover and tea enthusiast ☕',
    favoriteGenres: ['Fantasy', 'Sci-Fi'],
    readingStyle: 'Slow and steady'
  },
  { 
    id: 'user-2', 
    name: 'Brenda Chen', 
    avatarUrl: 'https://picsum.photos/seed/user-2/100/100',
    bio: 'Always reading three books at once 📚',
    favoriteGenres: ['Mystery', 'Literary Fiction'],
    readingStyle: 'Mood reader'
  },
  { 
    id: 'user-3', 
    name: 'Charlie Kim', 
    avatarUrl: 'https://picsum.photos/seed/user-3/100/100',
    bio: 'Classic literature nerd 🎭',
    favoriteGenres: ['Classics', 'Romance'],
    readingStyle: 'Fast reader'
  },
  {
    id: 'user-4',
    name: 'Diana Foster',
    avatarUrl: 'https://picsum.photos/seed/user-4/100/100',
    bio: 'Non-fiction junkie 🧠',
    favoriteGenres: ['Non-fiction', 'Biography'],
    readingStyle: 'Slow and analytical'
  },
  {
    id: 'user-5',
    name: 'Ethan Moore',
    avatarUrl: 'https://picsum.photos/seed/user-5/100/100',
    bio: 'Horror and thriller addict 👻',
    favoriteGenres: ['Horror', 'Thriller'],
    readingStyle: 'Binge reader'
  }
];

// Sample discussion posts
const defaultDiscussion: DiscussionPost[] = [
  { 
    id: 'd-1-1', 
    userId: 'user-2', 
    content: "What a powerful opening! The sense of foreboding is palpable.", 
    timestamp: '2024-05-20T10:00:00Z', 
    replies: [],
    reactions: { '❤️': ['user-1', 'user-3'], '🤔': ['user-4'] }
  },
  { 
    id: 'd-1-2', 
    userId: 'user-3', 
    content: "I agree. The political intrigue is set up so well from the very first page.", 
    timestamp: '2024-05-20T11:30:00Z', 
    replies: [
      { 
        id: 'd-1-2-1', 
        userId: 'user-1', 
        content: "Definitely! I'm already hooked on the Harkonnen vs. Atreides conflict.", 
        timestamp: '2024-05-20T12:00:00Z', 
        replies: []
      }
    ]
  },
];

// Chapters
const duneChapters: Chapter[] = [
  { 
    id: 'dune-1', 
    title: 'A Beginning', 
    chapterNumber: 1, 
    content: 'The story begins on the planet Caladan, home of House Atreides...', 
    pageStart: 1, 
    pageEnd: 15 
  },
  { 
    id: 'dune-2', 
    title: 'The Spice', 
    chapterNumber: 2, 
    content: 'Paul\'s training in the Bene Gesserit ways...', 
    pageStart: 16, 
    pageEnd: 32 
  },
  { 
    id: 'dune-3', 
    title: 'Arrakis', 
    chapterNumber: 3, 
    content: 'The Atreides family arrives on Arrakis...', 
    pageStart: 33, 
    pageEnd: 51 
  },
];

const prideChapters: Chapter[] = [
  { 
    id: 'pnp-1', 
    title: 'Chapter 1', 
    chapterNumber: 1, 
    content: 'It is a truth universally acknowledged...', 
    pageStart: 1, 
    pageEnd: 5 
  },
  { 
    id: 'pnp-2', 
    title: 'Chapter 2', 
    chapterNumber: 2, 
    content: 'Mr. Bennet reveals he has already paid a visit...', 
    pageStart: 6, 
    pageEnd: 10 
  },
];

const circeChapters: Chapter[] = [
  {
    id: 'circe-1',
    title: 'Grandfather',
    chapterNumber: 1,
    content: 'When I was born, the name for what I was did not exist...',
    pageStart: 1,
    pageEnd: 12
  },
  {
    id: 'circe-2',
    title: 'Exile',
    chapterNumber: 2,
    content: 'My father\'s halls were dark and silent...',
    pageStart: 13,
    pageEnd: 28
  }
];

// Books
export const books: Book[] = [
  {
    id: 'dune',
    title: 'Dune',
    author: 'Frank Herbert',
    coverUrl: 'https://picsum.photos/seed/dune/400/600',
    coverHint: 'desert planet',
    summary: 'Set on the desert planet Arrakis, Dune is the story of the boy Paul Atreides, heir to a noble family tasked with ruling an inhospitable world where the only thing of value is the "spice" melange, a drug capable of extending life and enhancing consciousness.',
    genre: 'Science Fiction',
    pageCount: 688,
    chapters: duneChapters,
    uploadedBy: 'user-1'
  },
  {
    id: 'pride-and-prejudice',
    title: 'Pride and Prejudice',
    author: 'Jane Austen',
    coverUrl: 'https://picsum.photos/seed/pride/400/600',
    coverHint: 'regency era',
    summary: 'A romantic novel of manners that tells the story of the emotional development of the protagonist, Elizabeth Bennet, who learns the error of making hasty judgments and comes to appreciate the difference between the superficial and the essential.',
    genre: 'Classic Romance',
    pageCount: 432,
    chapters: prideChapters,
  },
  {
    id: 'circe',
    title: 'Circe',
    author: 'Madeline Miller',
    coverUrl: 'https://picsum.photos/seed/circe/400/600',
    coverHint: 'greek mythology',
    summary: 'A feminist retelling of the Greek myth of Circe, the goddess of magic.',
    genre: 'Literary Fiction',
    pageCount: 400,
    chapters: circeChapters,
  },
  {
    id: 'the-hobbit',
    title: 'The Hobbit',
    author: 'J.R.R. Tolkien',
    coverUrl: 'https://picsum.photos/seed/hobbit/400/600',
    coverHint: 'fantasy landscape',
    summary: 'A fantasy novel and children\'s book about a hobbit named Bilbo Baggins. He is swept into an epic quest to reclaim the lost Dwarf Kingdom of Erebor from the fearsome dragon Smaug.',
    genre: 'Fantasy',
    pageCount: 310,
    chapters: [],
  },
  {
    id: 'project-hail-mary',
    title: 'Project Hail Mary',
    author: 'Andy Weir',
    coverUrl: 'https://picsum.photos/seed/hail-mary/400/600',
    coverHint: 'space station',
    summary: 'A lone astronaut must save the earth from disaster in this incredible new science-based thriller.',
    genre: 'Science Fiction',
    pageCount: 496,
    chapters: [],
  },
  {
    id: 'atomic-habits',
    title: 'Atomic Habits',
    author: 'James Clear',
    coverUrl: 'https://picsum.photos/seed/habits/400/600',
    coverHint: 'gears abstract',
    summary: 'An easy and proven way to build good habits and break bad ones.',
    genre: 'Self-Help',
    pageCount: 320,
    chapters: [],
    uploadedBy: 'user-4'
  },
  {
    id: 'the-midnight-library',
    title: 'The Midnight Library',
    author: 'Matt Haig',
    coverUrl: 'https://picsum.photos/seed/midnight/400/600',
    coverHint: 'mystical library',
    summary: 'Between life and death there is a library, and within that library, the shelves go on forever. Every book provides a chance to try another life you could have lived.',
    genre: 'Contemporary Fiction',
    pageCount: 304,
    chapters: [],
  },
  {
    id: 'educated',
    title: 'Educated',
    author: 'Tara Westover',
    coverUrl: 'https://picsum.photos/seed/educated/400/600',
    coverHint: 'mountain landscape',
    summary: 'A memoir about a young girl who, kept out of school, leaves her survivalist family and goes on to earn a PhD from Cambridge University.',
    genre: 'Memoir',
    pageCount: 352,
    chapters: [],
  }
];

// User Books (what each user is reading)
export const userBooks: UserBook[] = [
  // User 1 (Alex) - currently reading Dune
  {
    id: 'ub-1',
    userId: 'user-1',
    bookId: 'dune',
    format: 'physical',
    status: 'reading',
    currentPage: 156,
    currentChapter: 2,
    progressPercent: 23,
    startedAt: '2024-02-01T00:00:00Z',
  },
  // User 1 finished books
  {
    id: 'ub-2',
    userId: 'user-1',
    bookId: 'the-hobbit',
    format: 'ebook',
    status: 'finished',
    progressPercent: 100,
    startedAt: '2024-01-01T00:00:00Z',
    finishedAt: '2024-01-20T00:00:00Z',
    rating: 5
  },
  // User 2 (Brenda) - reading Pride and Prejudice
  {
    id: 'ub-3',
    userId: 'user-2',
    bookId: 'pride-and-prejudice',
    format: 'physical',
    status: 'reading',
    currentPage: 89,
    currentChapter: 1,
    progressPercent: 21,
    startedAt: '2024-02-05T00:00:00Z',
  },
  // User 2 also reading Atomic Habits (multi-book reader!)
  {
    id: 'ub-4',
    userId: 'user-2',
    bookId: 'atomic-habits',
    format: 'audiobook',
    status: 'reading',
    progressPercent: 45,
    startedAt: '2024-02-03T00:00:00Z',
  },
  // User 3 (Charlie) - reading Circe
  {
    id: 'ub-5',
    userId: 'user-3',
    bookId: 'circe',
    format: 'ebook',
    status: 'reading',
    currentPage: 120,
    currentChapter: 2,
    progressPercent: 30,
    startedAt: '2024-02-07T00:00:00Z',
  },
  // User 4 (Diana) - reading Educated
  {
    id: 'ub-6',
    userId: 'user-4',
    bookId: 'educated',
    format: 'physical',
    status: 'reading',
    currentPage: 200,
    progressPercent: 57,
    startedAt: '2024-01-28T00:00:00Z',
  },
  // User 5 (Ethan) - reading Project Hail Mary
  {
    id: 'ub-7',
    userId: 'user-5',
    bookId: 'project-hail-mary',
    format: 'physical',
    status: 'reading',
    currentPage: 250,
    progressPercent: 50,
    startedAt: '2024-02-02T00:00:00Z',
  }
];

// Clubs - Now communities, not tied to one book!
export const clubs: (Club & { id: string })[] = [
  {
    id: 'cozy-readers',
    name: 'Cozy Readers Circle',
    description: 'A warm community for readers who love getting lost in books. We read different genres, share our journeys, and support each other.',
    vibe: 'Supportive and cozy',
    isPublic: true,
    memberIds: ['user-1', 'user-2', 'user-3', 'user-4'],
    ownerId: 'user-1',
    theme: 'All genres welcome',
    coverImage: 'https://picsum.photos/seed/cozy/800/400',
    createdAt: '2024-01-01T00:00:00Z'
  },
  {
    id: 'fantasy-lovers',
    name: 'Fantasy Lovers United',
    description: 'For those who prefer dragons, magic, and otherworldly adventures. Everyone reading their own fantasy journey!',
    vibe: 'Epic and imaginative',
    isPublic: true,
    memberIds: ['user-1', 'user-3', 'user-5'],
    ownerId: 'user-3',
    theme: 'Fantasy & Sci-Fi',
    createdAt: '2024-01-15T00:00:00Z'
  },
  {
    id: 'book-friends',
    name: 'Just Book Friends',
    description: 'No pressure, no schedules. Just friends who love to read and chat about books.',
    vibe: 'Casual and friendly',
    isPublic: true,
    memberIds: ['user-2', 'user-3', 'user-4', 'user-5'],
    ownerId: 'user-2',
    createdAt: '2024-01-20T00:00:00Z'
  }
];

// Club Members with current reading info
export const clubMembers: ClubMember[] = [
  {
    userId: 'user-1',
    clubId: 'cozy-readers',
    currentlyReading: {
      bookId: 'dune',
      startedAt: '2024-02-01T00:00:00Z',
      progressPercent: 23
    },
    joinedAt: '2024-01-01T00:00:00Z',
    role: 'owner',
    isOnline: true,
    lastSeen: new Date().toISOString()
  },
  {
    userId: 'user-2',
    clubId: 'cozy-readers',
    currentlyReading: {
      bookId: 'pride-and-prejudice',
      startedAt: '2024-02-05T00:00:00Z',
      progressPercent: 21
    },
    joinedAt: '2024-01-01T00:00:00Z',
    role: 'moderator',
    isOnline: false,
    lastSeen: '2024-02-09T08:00:00Z'
  },
  {
    userId: 'user-3',
    clubId: 'cozy-readers',
    currentlyReading: {
      bookId: 'circe',
      startedAt: '2024-02-07T00:00:00Z',
      progressPercent: 30
    },
    joinedAt: '2024-01-02T00:00:00Z',
    role: 'member',
    isOnline: true,
    lastSeen: new Date().toISOString()
  },
  {
    userId: 'user-4',
    clubId: 'cozy-readers',
    currentlyReading: {
      bookId: 'educated',
      startedAt: '2024-01-28T00:00:00Z',
      progressPercent: 57
    },
    joinedAt: '2024-01-10T00:00:00Z',
    role: 'member',
    isOnline: false,
    lastSeen: '2024-02-08T22:00:00Z'
  }
];

// Discussions (mix of book-specific and general)
export const discussions: Discussion[] = [
  {
    id: 'disc-1',
    clubId: 'cozy-readers',
    type: 'general',
    title: 'Welcome & Introductions',
    description: 'Introduce yourself and share what you\'re currently reading!',
    createdBy: 'user-1',
    createdAt: '2024-01-01T00:00:00Z',
    isPinned: true
  },
  {
    id: 'disc-2',
    clubId: 'cozy-readers',
    type: 'book-specific',
    title: 'Dune Discussion',
    bookId: 'dune',
    createdBy: 'user-1',
    createdAt: '2024-02-01T00:00:00Z',
  },
  {
    id: 'disc-3',
    clubId: 'cozy-readers',
    type: 'thematic',
    title: 'Strong Female Characters',
    description: 'Circe, Elizabeth Bennet, and other powerful women in literature',
    createdBy: 'user-3',
    createdAt: '2024-02-08T00:00:00Z',
    tags: ['discussion', 'characters']
  },
  {
    id: 'disc-4',
    clubId: 'cozy-readers',
    type: 'check-in',
    title: 'Weekend Reading Check-in',
    description: 'How many pages did everyone get through this weekend?',
    createdBy: 'user-2',
    createdAt: '2024-02-09T00:00:00Z',
  }
];

// Reading Activities (for activity feed)
export const readingActivities: ReadingActivity[] = [
  {
    id: 'act-1',
    userId: 'user-3',
    clubId: 'cozy-readers',
    type: 'started-book',
    bookId: 'circe',
    timestamp: '2024-02-07T10:00:00Z'
  },
  {
    id: 'act-2',
    userId: 'user-1',
    clubId: 'cozy-readers',
    type: 'finished-chapter',
    bookId: 'dune',
    timestamp: '2024-02-08T18:30:00Z',
    content: 'Chapter 2 done! The worldbuilding is incredible 🏜️'
  },
  {
    id: 'act-3',
    userId: 'user-4',
    type: 'shared-quote',
    bookId: 'educated',
    timestamp: '2024-02-08T20:00:00Z',
    content: '"You can love someone and still choose to say goodbye to them."'
  },
  {
    id: 'act-4',
    userId: 'user-2',
    clubId: 'cozy-readers',
    type: 'finished-book',
    bookId: 'atomic-habits',
    timestamp: '2024-02-09T09:00:00Z',
    content: 'Just finished! This book changed how I think about habits 🎉'
  }
];

// Reading Session (scheduled or active)
export const readingSessions: ReadingSession[] = [
  {
    id: 'session-1',
    clubId: 'cozy-readers',
    scheduledFor: '2024-02-10T10:00:00Z',
    durationMinutes: 120,
    title: 'Saturday Morning Reading Session',
    description: 'Bring your coffee and your current book! ☕📚',
    hostId: 'user-1',
    activeParticipants: [],
    chatMessages: []
  }
];

// Helper functions to get data
export function getUserBooks(userId: string) {
  return userBooks.filter(ub => ub.userId === userId);
}

export function getClubMembers(clubId: string) {
  const club = clubs.find(c => c.id === clubId);
  if (!club) return [];
  return users.filter(u => club.memberIds.includes(u.id));
}

export function getClubMemberDetails(clubId: string) {
  return clubMembers.filter(cm => cm.clubId === clubId);
}

export function getCurrentlyReadingInClub(clubId: string) {
  const members = getClubMemberDetails(clubId);
  return members
    .filter(m => m.currentlyReading)
    .map(m => ({
      member: users.find(u => u.id === m.userId)!,
      book: books.find(b => b.id === m.currentlyReading?.bookId)!,
      progress: m.currentlyReading!.progressPercent,
      isOnline: m.isOnline
    }));
}

export function getBookDiscussions(clubId: string, bookId: string) {
  return discussions.filter(d => d.clubId === clubId && d.bookId === bookId);
}

export function getGeneralDiscussions(clubId: string) {
  return discussions.filter(d => d.clubId === clubId && d.type === 'general');
}