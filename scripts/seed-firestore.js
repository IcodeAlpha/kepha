// scripts/seed-firestore.js
// Run with: node scripts/seed-firestore.js
// No TypeScript compilation needed!

const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();
const FieldValue = admin.firestore.FieldValue;

// ── Helpers ────────────────────────────────────────────────────────────────
const ts = () => FieldValue.serverTimestamp();
const past = (daysAgo) => {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return admin.firestore.Timestamp.fromDate(d);
};

// ── 1. USERS (20 users) ────────────────────────────────────────────────────
const users = [
  { uid: 'user-001', name: 'Alex Rivera',    avatarUrl: 'https://picsum.photos/seed/user001/100/100', bio: 'Fantasy & sci-fi lover. Coffee in one hand, book in the other.', favoriteGenres: ['Fantasy', 'Sci-Fi'], readingStyle: 'Night owl reader' },
  { uid: 'user-002', name: 'Jordan Kim',     avatarUrl: 'https://picsum.photos/seed/user002/100/100', bio: 'Classic literature enthusiast and occasional poet.', favoriteGenres: ['Classics', 'Poetry'], readingStyle: 'Morning reader' },
  { uid: 'user-003', name: 'Morgan Lee',     avatarUrl: 'https://picsum.photos/seed/user003/100/100', bio: 'I read everything. Seriously, everything.', favoriteGenres: ['Thriller', 'Mystery'], readingStyle: 'Binge reader' },
  { uid: 'user-004', name: 'Casey Chen',     avatarUrl: 'https://picsum.photos/seed/user004/100/100', bio: 'Romance and historical fiction are my comfort zone.', favoriteGenres: ['Romance', 'Historical Fiction'], readingStyle: 'Slow and steady' },
  { uid: 'user-005', name: 'Riley Patel',    avatarUrl: 'https://picsum.photos/seed/user005/100/100', bio: 'Non-fiction nerd. Love learning about the world.', favoriteGenres: ['Non-Fiction', 'Biography'], readingStyle: 'Annotator' },
  { uid: 'user-006', name: 'Avery Thompson', avatarUrl: 'https://picsum.photos/seed/user006/100/100', bio: 'YA and graphic novels forever.', favoriteGenres: ['YA', 'Graphic Novels'], readingStyle: 'Visual reader' },
  { uid: 'user-007', name: 'Quinn Davis',    avatarUrl: 'https://picsum.photos/seed/user007/100/100', bio: 'Horror and dark fiction enthusiast. The darker the better.', favoriteGenres: ['Horror', 'Dark Fiction'], readingStyle: 'Late night reader' },
  { uid: 'user-008', name: 'Skyler Brown',   avatarUrl: 'https://picsum.photos/seed/user008/100/100', bio: 'Literary fiction and award winners only.', favoriteGenres: ['Literary Fiction'], readingStyle: 'Thoughtful reader' },
  { uid: 'user-009', name: 'Drew Wilson',    avatarUrl: 'https://picsum.photos/seed/user009/100/100', bio: 'Philosophy and self-help books changed my life.', favoriteGenres: ['Philosophy', 'Self-Help'], readingStyle: 'Re-reader' },
  { uid: 'user-010', name: 'Blake Martinez', avatarUrl: 'https://picsum.photos/seed/user010/100/100', bio: 'Crime fiction and true crime podcasts. Yes, both.', favoriteGenres: ['Crime', 'True Crime'], readingStyle: 'Podcast + book' },
  { uid: 'user-011', name: 'Sam Johnson',    avatarUrl: 'https://picsum.photos/seed/user011/100/100', bio: 'Audiobook convert. 3x speed gang.', favoriteGenres: ['Sci-Fi', 'Fantasy'], readingStyle: 'Audiobook listener' },
  { uid: 'user-012', name: 'Taylor Nguyen',  avatarUrl: 'https://picsum.photos/seed/user012/100/100', bio: 'Magical realism and translated fiction are underrated.', favoriteGenres: ['Magical Realism', 'World Literature'], readingStyle: 'Explorer' },
  { uid: 'user-013', name: 'Jamie Park',     avatarUrl: 'https://picsum.photos/seed/user013/100/100', bio: 'Cozy mysteries and tea. That is my whole personality.', favoriteGenres: ['Cozy Mystery', 'Classics'], readingStyle: 'Cozy reader' },
  { uid: 'user-014', name: 'Reese Garcia',   avatarUrl: 'https://picsum.photos/seed/user014/100/100', bio: 'Science and technology books. Also Star Trek.', favoriteGenres: ['Science', 'Sci-Fi'], readingStyle: 'Research-mode' },
  { uid: 'user-015', name: 'Dana White',     avatarUrl: 'https://picsum.photos/seed/user015/100/100', bio: 'Historical fiction transports me. Love it.', favoriteGenres: ['Historical Fiction', 'Biography'], readingStyle: 'Deep diver' },
  { uid: 'user-016', name: 'Jessie Clark',   avatarUrl: 'https://picsum.photos/seed/user016/100/100', bio: 'Contemporary fiction and short stories.', favoriteGenres: ['Contemporary', 'Short Stories'], readingStyle: 'Casual reader' },
  { uid: 'user-017', name: 'Frankie Lewis',  avatarUrl: 'https://picsum.photos/seed/user017/100/100', bio: 'Dystopian fiction and speculative futures.', favoriteGenres: ['Dystopian', 'Sci-Fi'], readingStyle: 'Fast reader' },
  { uid: 'user-018', name: 'Chris Hall',     avatarUrl: 'https://picsum.photos/seed/user018/100/100', bio: 'Epic fantasy series. The longer the better.', favoriteGenres: ['Epic Fantasy', 'High Fantasy'], readingStyle: 'Series reader' },
  { uid: 'user-019', name: 'Peyton Adams',   avatarUrl: 'https://picsum.photos/seed/user019/100/100', bio: 'Women\'s fiction and memoir are my jam.', favoriteGenres: ['Women\'s Fiction', 'Memoir'], readingStyle: 'Emotional reader' },
  { uid: 'user-020', name: 'Rowan Scott',    avatarUrl: 'https://picsum.photos/seed/user020/100/100', bio: 'New to reading clubs. Excited to share!', favoriteGenres: ['Fantasy', 'Romance'], readingStyle: 'New reader' },
];

// ── 2. BOOKS (40 books) ────────────────────────────────────────────────────
const books = [
  // Sci-Fi
  { id: 'dune',                   title: 'Dune',                           author: 'Frank Herbert',        genre: 'Sci-Fi',            pageCount: 688,  coverUrl: 'https://picsum.photos/seed/dune/400/600',      coverHint: 'desert planet',      summary: 'A sweeping tale of politics, religion, and survival on the desert planet Arrakis.' },
  { id: 'foundation',             title: 'Foundation',                     author: 'Isaac Asimov',         genre: 'Sci-Fi',            pageCount: 244,  coverUrl: 'https://picsum.photos/seed/foundation/400/600', coverHint: 'galaxy empire',      summary: 'The fall of a Galactic Empire and the plan to preserve civilization.' },
  { id: 'martian',                title: 'The Martian',                    author: 'Andy Weir',            genre: 'Sci-Fi',            pageCount: 369,  coverUrl: 'https://picsum.photos/seed/martian/400/600',   coverHint: 'red mars surface',   summary: 'An astronaut is stranded on Mars and must science his way to survival.' },
  { id: 'enders-game',            title: "Ender's Game",                   author: 'Orson Scott Card',     genre: 'Sci-Fi',            pageCount: 352,  coverUrl: 'https://picsum.photos/seed/enders/400/600',    coverHint: 'space battle',       summary: 'A child prodigy is trained to fight in an interstellar war.' },
  { id: 'hitchhikers-guide',      title: 'The Hitchhiker\'s Guide',        author: 'Douglas Adams',        genre: 'Sci-Fi Comedy',     pageCount: 193,  coverUrl: 'https://picsum.photos/seed/hitchhiker/400/600', coverHint: 'galaxy map',        summary: 'An ordinary man\'s extraordinary journey through space after Earth is demolished.' },
  // Fantasy
  { id: 'name-of-the-wind',       title: 'The Name of the Wind',          author: 'Patrick Rothfuss',     genre: 'Fantasy',           pageCount: 662,  coverUrl: 'https://picsum.photos/seed/namewind/400/600',  coverHint: 'medieval inn',       summary: 'The legend of Kvothe, the most notorious wizard his world has ever seen.' },
  { id: 'way-of-kings',           title: 'The Way of Kings',               author: 'Brandon Sanderson',    genre: 'Epic Fantasy',      pageCount: 1007, coverUrl: 'https://picsum.photos/seed/wayofkings/400/600', coverHint: 'stormy sky',        summary: 'An epic tale of war, magic, and destiny on a world battered by magical storms.' },
  { id: 'mistborn',               title: 'Mistborn',                       author: 'Brandon Sanderson',    genre: 'Fantasy',           pageCount: 541,  coverUrl: 'https://picsum.photos/seed/mistborn/400/600',  coverHint: 'ash falling',        summary: 'A heist crew attempts to overthrow an immortal dark lord using magic metal powers.' },
  { id: 'lies-of-locke-lamora',   title: 'The Lies of Locke Lamora',      author: 'Scott Lynch',          genre: 'Fantasy',           pageCount: 752,  coverUrl: 'https://picsum.photos/seed/locke/400/600',     coverHint: 'Venice canal',       summary: 'A gang of thieves runs cons in a fantasy Venice-inspired city.' },
  // Classics
  { id: 'pride-and-prejudice',    title: 'Pride and Prejudice',            author: 'Jane Austen',          genre: 'Classic Romance',   pageCount: 432,  coverUrl: 'https://picsum.photos/seed/pride/400/600',     coverHint: 'regency era',        summary: 'Elizabeth Bennet navigates love, class, and pride in Regency England.' },
  { id: '1984',                   title: '1984',                           author: 'George Orwell',        genre: 'Dystopian',         pageCount: 328,  coverUrl: 'https://picsum.photos/seed/1984/400/600',      coverHint: 'surveillance eye',   summary: 'A totalitarian society where Big Brother watches everyone.' },
  { id: 'brave-new-world',        title: 'Brave New World',                author: 'Aldous Huxley',        genre: 'Dystopian',         pageCount: 311,  coverUrl: 'https://picsum.photos/seed/bravenew/400/600',  coverHint: 'futuristic city',    summary: 'A dystopian society where happiness is manufactured and individuality eliminated.' },
  { id: 'great-gatsby',           title: 'The Great Gatsby',               author: 'F. Scott Fitzgerald',  genre: 'Literary Fiction',  pageCount: 180,  coverUrl: 'https://picsum.photos/seed/gatsby/400/600',    coverHint: '1920s party',        summary: 'The mysterious millionaire Jay Gatsby and his obsession with Daisy Buchanan.' },
  { id: 'to-kill-a-mockingbird',  title: 'To Kill a Mockingbird',          author: 'Harper Lee',           genre: 'Literary Fiction',  pageCount: 281,  coverUrl: 'https://picsum.photos/seed/mockingbird/400/600', coverHint: 'small town south', summary: 'A lawyer defends a Black man falsely accused in the American South.' },
  { id: 'jane-eyre',              title: 'Jane Eyre',                      author: 'Charlotte Brontë',     genre: 'Classic Romance',   pageCount: 507,  coverUrl: 'https://picsum.photos/seed/janeeyre/400/600',  coverHint: 'gothic mansion',     summary: 'An orphan governess falls for her brooding employer in Victorian England.' },
  // Mystery/Thriller
  { id: 'gone-girl',              title: 'Gone Girl',                      author: 'Gillian Flynn',        genre: 'Thriller',          pageCount: 422,  coverUrl: 'https://picsum.photos/seed/gonegirl/400/600',  coverHint: 'missing person',     summary: 'A woman disappears on her anniversary and nothing is what it seems.' },
  { id: 'girl-with-dragon-tattoo', title: 'The Girl with the Dragon Tattoo', author: 'Stieg Larsson',   genre: 'Crime Thriller',    pageCount: 465,  coverUrl: 'https://picsum.photos/seed/dragontat/400/600', coverHint: 'Stockholm winter',   summary: 'A journalist and hacker investigate a decades-old disappearance.' },
  { id: 'and-then-there-were-none', title: 'And Then There Were None',    author: 'Agatha Christie',      genre: 'Mystery',           pageCount: 272,  coverUrl: 'https://picsum.photos/seed/agatha/400/600',    coverHint: 'remote island',      summary: 'Ten strangers are lured to an island and begin to die one by one.' },
  { id: 'big-sleep',              title: 'The Big Sleep',                  author: 'Raymond Chandler',     genre: 'Noir Mystery',      pageCount: 231,  coverUrl: 'https://picsum.photos/seed/bigsleep/400/600',  coverHint: '1940s Los Angeles',  summary: 'Private detective Philip Marlowe investigates a blackmail case in LA.' },
  // Romance
  { id: 'outlander',              title: 'Outlander',                      author: 'Diana Gabaldon',       genre: 'Historical Romance', pageCount: 850, coverUrl: 'https://picsum.photos/seed/outlander/400/600', coverHint: 'Scottish highlands', summary: 'A WWII nurse is transported to 18th century Scotland.' },
  { id: 'normal-people',          title: 'Normal People',                  author: 'Sally Rooney',         genre: 'Contemporary Romance', pageCount: 273, coverUrl: 'https://picsum.photos/seed/normalpeople/400/600', coverHint: 'two people', summary: 'An on-and-off romance between two young Irish people over several years.' },
  { id: 'beach-read',             title: 'Beach Read',                     author: 'Emily Henry',          genre: 'Romance',           pageCount: 361,  coverUrl: 'https://picsum.photos/seed/beachread/400/600', coverHint: 'beach house',        summary: 'Two rival authors with writer\'s block swap genres for the summer.' },
  // Non-Fiction
  { id: 'sapiens',                title: 'Sapiens',                        author: 'Yuval Noah Harari',    genre: 'Non-Fiction',       pageCount: 443,  coverUrl: 'https://picsum.photos/seed/sapiens/400/600',   coverHint: 'human history',      summary: 'A brief history of humankind from the Stone Age to the present.' },
  { id: 'atomic-habits',          title: 'Atomic Habits',                  author: 'James Clear',          genre: 'Self-Help',         pageCount: 320,  coverUrl: 'https://picsum.photos/seed/atomichabits/400/600', coverHint: 'small steps',     summary: 'How tiny changes in habits can lead to remarkable results.' },
  { id: 'educated',               title: 'Educated',                       author: 'Tara Westover',        genre: 'Memoir',            pageCount: 334,  coverUrl: 'https://picsum.photos/seed/educated/400/600',  coverHint: 'mountains Idaho',    summary: 'A memoir about growing up in a survivalist family and pursuing education.' },
  { id: 'becoming',               title: 'Becoming',                       author: 'Michelle Obama',       genre: 'Memoir',            pageCount: 448,  coverUrl: 'https://picsum.photos/seed/becoming/400/600',  coverHint: 'portrait powerful',  summary: 'Michelle Obama\'s memoir about her life, career, and time in the White House.' },
  { id: 'thinking-fast-and-slow', title: 'Thinking, Fast and Slow',        author: 'Daniel Kahneman',      genre: 'Psychology',        pageCount: 499,  coverUrl: 'https://picsum.photos/seed/thinkfast/400/600', coverHint: 'brain diagram',      summary: 'How two systems of thinking shape our judgments and decisions.' },
  // Horror
  { id: 'it',                     title: 'It',                             author: 'Stephen King',         genre: 'Horror',            pageCount: 1138, coverUrl: 'https://picsum.photos/seed/stephenking/400/600', coverHint: 'red balloon',      summary: 'A group of childhood friends face an ancient evil lurking in their town.' },
  { id: 'haunting-hill-house',    title: 'The Haunting of Hill House',     author: 'Shirley Jackson',      genre: 'Horror',            pageCount: 182,  coverUrl: 'https://picsum.photos/seed/hillhouse/400/600', coverHint: 'haunted mansion',    summary: 'Four people investigate a notoriously haunted house and face psychological terror.' },
  // Literary Fiction
  { id: 'kite-runner',            title: 'The Kite Runner',                author: 'Khaled Hosseini',      genre: 'Literary Fiction',  pageCount: 371,  coverUrl: 'https://picsum.photos/seed/kiterunner/400/600', coverHint: 'kite Afghanistan', summary: 'A story of friendship, betrayal, and redemption set in Afghanistan.' },
  { id: 'alchemist',              title: 'The Alchemist',                  author: 'Paulo Coelho',         genre: 'Literary Fiction',  pageCount: 197,  coverUrl: 'https://picsum.photos/seed/alchemist/400/600', coverHint: 'desert journey',     summary: 'A shepherd boy\'s journey to find his personal legend.' },
  { id: 'beloved',                title: 'Beloved',                        author: 'Toni Morrison',        genre: 'Literary Fiction',  pageCount: 324,  coverUrl: 'https://picsum.photos/seed/beloved/400/600',   coverHint: 'haunting past',      summary: 'A former enslaved woman is haunted by the ghost of her baby daughter.' },
  { id: 'hundred-years-solitude', title: 'One Hundred Years of Solitude', author: 'Gabriel García Márquez', genre: 'Magical Realism', pageCount: 417,  coverUrl: 'https://picsum.photos/seed/solitude/400/600',  coverHint: 'tropical village',   summary: 'Seven generations of the Buendía family in the fictional town of Macondo.' },
  // YA
  { id: 'hunger-games',           title: 'The Hunger Games',               author: 'Suzanne Collins',      genre: 'YA Dystopian',      pageCount: 374,  coverUrl: 'https://picsum.photos/seed/hungergames/400/600', coverHint: 'arena fire',       summary: 'In a dystopian future, teens are forced to fight to the death for entertainment.' },
  { id: 'perks-wallflower',       title: 'The Perks of Being a Wallflower', author: 'Stephen Chbosky',    genre: 'YA',                pageCount: 213,  coverUrl: 'https://picsum.photos/seed/perks/400/600',     coverHint: 'tunnel light',       summary: 'An introverted teen navigates high school, friendship, and personal trauma.' },
  // History/Science
  { id: 'short-history',          title: 'A Short History of Nearly Everything', author: 'Bill Bryson',  genre: 'Science',           pageCount: 544,  coverUrl: 'https://picsum.photos/seed/shorthistory/400/600', coverHint: 'universe stars',  summary: 'Bill Bryson explores science and the history of scientific discovery.' },
  { id: 'guns-germs-steel',       title: 'Guns, Germs, and Steel',         author: 'Jared Diamond',        genre: 'History',           pageCount: 480,  coverUrl: 'https://picsum.photos/seed/gunsgerm/400/600',  coverHint: 'world map ancient',  summary: 'Why did some civilizations come to dominate others throughout history?' },
  // More Contemporary
  { id: 'circe',                  title: 'Circe',                          author: 'Madeline Miller',      genre: 'Fantasy/Mythology', pageCount: 393,  coverUrl: 'https://picsum.photos/seed/circe/400/600',     coverHint: 'Greek mythology',    summary: 'The story of the witch Circe from Greek mythology, finding her powers.' },
  { id: 'piranesi',               title: 'Piranesi',                       author: 'Susanna Clarke',       genre: 'Fantasy/Mystery',   pageCount: 272,  coverUrl: 'https://picsum.photos/seed/piranesi/400/600',  coverHint: 'infinite halls',     summary: 'A man lives in a mysterious house with infinite halls and tidal seas.' },
  { id: 'project-hail-mary',      title: 'Project Hail Mary',              author: 'Andy Weir',            genre: 'Sci-Fi',            pageCount: 476,  coverUrl: 'https://picsum.photos/seed/hailmary/400/600',  coverHint: 'lone astronaut',     summary: 'An astronaut wakes up alone in space with no memory, tasked with saving Earth.' },
];

// ── 3. CLUBS (5 clubs) ─────────────────────────────────────────────────────
const clubs = [
  {
    id: 'cozy-readers',
    name: 'Cozy Readers Circle',
    description: 'A warm, welcoming community for readers of all genres. No pressure, just good books and good vibes.',
    vibe: 'Supportive and cozy',
    isPublic: true,
    theme: 'All genres welcome',
    ownerId: 'user-001',
    memberIds: ['user-001', 'user-002', 'user-003', 'user-004', 'user-005', 'user-006', 'user-019', 'user-020'],
  },
  {
    id: 'sci-fi-explorers',
    name: 'Sci-Fi Explorers',
    description: 'For fans of science fiction, space opera, cyberpunk, and all things futuristic. The universe is our library.',
    vibe: 'Curious and speculative',
    isPublic: true,
    theme: 'Science Fiction & Speculative Fiction',
    ownerId: 'user-014',
    memberIds: ['user-014', 'user-011', 'user-017', 'user-001', 'user-003', 'user-007'],
  },
  {
    id: 'classic-lit-society',
    name: 'Classic Literature Society',
    description: 'Dedicated to the timeless works of classic literature. From Austen to Tolstoy, we read the greats.',
    vibe: 'Thoughtful and scholarly',
    isPublic: true,
    theme: 'Classic & Literary Fiction',
    ownerId: 'user-002',
    memberIds: ['user-002', 'user-008', 'user-013', 'user-015', 'user-004'],
  },
  {
    id: 'thriller-den',
    name: 'Thriller & Mystery Den',
    description: 'Can\'t put the book down? That\'s us. We live for plot twists, red herrings, and unreliable narrators.',
    vibe: 'Edgy and suspenseful',
    isPublic: true,
    theme: 'Thrillers, Mystery & Crime',
    ownerId: 'user-010',
    memberIds: ['user-010', 'user-003', 'user-007', 'user-016', 'user-012', 'user-013'],
  },
  {
    id: 'fantasy-fellowship',
    name: 'The Fantasy Fellowship',
    description: 'Epic quests, magic systems, and world-building are our love language. All fantasy subgenres welcome.',
    vibe: 'Epic and imaginative',
    isPublic: false,
    theme: 'Fantasy & Mythology',
    ownerId: 'user-018',
    memberIds: ['user-018', 'user-001', 'user-006', 'user-012', 'user-009', 'user-017', 'user-020'],
  },
];

// ── 4. USER BOOKS ──────────────────────────────────────────────────────────
// Each entry: { userId, bookId, status, format, progressPercent, currentPage, rating }
const userBooksData = [
  // user-001 Alex: currently reading dune, finished foundation + mistborn
  { userId: 'user-001', bookId: 'dune',              status: 'reading',       format: 'physical',  progressPercent: 45, currentPage: 310 },
  { userId: 'user-001', bookId: 'foundation',        status: 'finished',      format: 'ebook',     progressPercent: 100, rating: 5 },
  { userId: 'user-001', bookId: 'mistborn',          status: 'finished',      format: 'physical',  progressPercent: 100, rating: 4 },
  { userId: 'user-001', bookId: 'project-hail-mary', status: 'want-to-read', format: 'ebook',     progressPercent: 0 },
  // user-002 Jordan: reading pride-and-prejudice, finished jane-eyre + great-gatsby
  { userId: 'user-002', bookId: 'pride-and-prejudice', status: 'reading',    format: 'physical',  progressPercent: 60, currentPage: 259 },
  { userId: 'user-002', bookId: 'jane-eyre',          status: 'finished',    format: 'physical',  progressPercent: 100, rating: 5 },
  { userId: 'user-002', bookId: 'great-gatsby',       status: 'finished',    format: 'ebook',     progressPercent: 100, rating: 4 },
  { userId: 'user-002', bookId: '1984',               status: 'finished',    format: 'physical',  progressPercent: 100, rating: 5 },
  // user-003 Morgan: reading gone-girl, finished girl-with-dragon-tattoo
  { userId: 'user-003', bookId: 'gone-girl',          status: 'reading',     format: 'ebook',     progressPercent: 30, currentPage: 126 },
  { userId: 'user-003', bookId: 'girl-with-dragon-tattoo', status: 'finished', format: 'physical', progressPercent: 100, rating: 4 },
  { userId: 'user-003', bookId: 'and-then-there-were-none', status: 'finished', format: 'ebook', progressPercent: 100, rating: 5 },
  // user-004 Casey: reading outlander
  { userId: 'user-004', bookId: 'outlander',          status: 'reading',     format: 'physical',  progressPercent: 55, currentPage: 467 },
  { userId: 'user-004', bookId: 'normal-people',      status: 'finished',    format: 'ebook',     progressPercent: 100, rating: 4 },
  { userId: 'user-004', bookId: 'beach-read',         status: 'finished',    format: 'physical',  progressPercent: 100, rating: 5 },
  // user-005 Riley: reading sapiens, finished educated + becoming
  { userId: 'user-005', bookId: 'sapiens',            status: 'reading',     format: 'physical',  progressPercent: 70, currentPage: 310 },
  { userId: 'user-005', bookId: 'educated',           status: 'finished',    format: 'audiobook', progressPercent: 100, rating: 5 },
  { userId: 'user-005', bookId: 'becoming',           status: 'finished',    format: 'audiobook', progressPercent: 100, rating: 4 },
  { userId: 'user-005', bookId: 'atomic-habits',      status: 'finished',    format: 'ebook',     progressPercent: 100, rating: 5 },
  // user-006 Avery: reading hunger-games
  { userId: 'user-006', bookId: 'hunger-games',       status: 'reading',     format: 'physical',  progressPercent: 80, currentPage: 299 },
  { userId: 'user-006', bookId: 'perks-wallflower',   status: 'finished',    format: 'physical',  progressPercent: 100, rating: 5 },
  // user-007 Quinn: reading it, finished haunting-hill-house
  { userId: 'user-007', bookId: 'it',                 status: 'reading',     format: 'physical',  progressPercent: 20, currentPage: 227 },
  { userId: 'user-007', bookId: 'haunting-hill-house', status: 'finished',   format: 'ebook',     progressPercent: 100, rating: 4 },
  // user-008 Skyler: reading beloved, finished kite-runner
  { userId: 'user-008', bookId: 'beloved',            status: 'reading',     format: 'physical',  progressPercent: 40, currentPage: 129 },
  { userId: 'user-008', bookId: 'kite-runner',        status: 'finished',    format: 'physical',  progressPercent: 100, rating: 5 },
  { userId: 'user-008', bookId: 'alchemist',          status: 'finished',    format: 'ebook',     progressPercent: 100, rating: 4 },
  // user-009 Drew: reading thinking-fast-and-slow
  { userId: 'user-009', bookId: 'thinking-fast-and-slow', status: 'reading', format: 'physical',  progressPercent: 50, currentPage: 249 },
  { userId: 'user-009', bookId: 'sapiens',            status: 'finished',    format: 'ebook',     progressPercent: 100, rating: 5 },
  // user-010 Blake: reading big-sleep, finished gone-girl
  { userId: 'user-010', bookId: 'big-sleep',          status: 'reading',     format: 'ebook',     progressPercent: 65, currentPage: 150 },
  { userId: 'user-010', bookId: 'gone-girl',          status: 'finished',    format: 'physical',  progressPercent: 100, rating: 4 },
  // user-011 Sam: reading enders-game (audiobook)
  { userId: 'user-011', bookId: 'enders-game',        status: 'reading',     format: 'audiobook', progressPercent: 35, currentPage: 123 },
  { userId: 'user-011', bookId: 'hitchhikers-guide',  status: 'finished',    format: 'audiobook', progressPercent: 100, rating: 5 },
  { userId: 'user-011', bookId: 'martian',            status: 'finished',    format: 'audiobook', progressPercent: 100, rating: 5 },
  // user-012 Taylor: reading hundred-years-solitude
  { userId: 'user-012', bookId: 'hundred-years-solitude', status: 'reading', format: 'physical', progressPercent: 25, currentPage: 104 },
  { userId: 'user-012', bookId: 'circe',              status: 'finished',    format: 'ebook',     progressPercent: 100, rating: 5 },
  // user-013 Jamie: reading and-then-there-were-none, finished big-sleep
  { userId: 'user-013', bookId: 'and-then-there-were-none', status: 'reading', format: 'physical', progressPercent: 55, currentPage: 149 },
  { userId: 'user-013', bookId: 'big-sleep',          status: 'finished',    format: 'physical',  progressPercent: 100, rating: 4 },
  // user-014 Reese: reading project-hail-mary, finished martian
  { userId: 'user-014', bookId: 'project-hail-mary', status: 'reading',     format: 'ebook',     progressPercent: 60, currentPage: 285 },
  { userId: 'user-014', bookId: 'martian',            status: 'finished',    format: 'ebook',     progressPercent: 100, rating: 5 },
  { userId: 'user-014', bookId: 'short-history',      status: 'finished',    format: 'physical',  progressPercent: 100, rating: 4 },
  // user-015 Dana: reading outlander
  { userId: 'user-015', bookId: 'outlander',          status: 'reading',     format: 'physical',  progressPercent: 85, currentPage: 722 },
  { userId: 'user-015', bookId: 'guns-germs-steel',   status: 'finished',    format: 'physical',  progressPercent: 100, rating: 4 },
  { userId: 'user-015', bookId: 'educated',           status: 'finished',    format: 'physical',  progressPercent: 100, rating: 5 },
  // user-016 Jessie: reading normal-people
  { userId: 'user-016', bookId: 'normal-people',      status: 'reading',     format: 'ebook',     progressPercent: 40, currentPage: 109 },
  { userId: 'user-016', bookId: 'beach-read',         status: 'finished',    format: 'physical',  progressPercent: 100, rating: 4 },
  // user-017 Frankie: reading 1984
  { userId: 'user-017', bookId: '1984',               status: 'reading',     format: 'ebook',     progressPercent: 75, currentPage: 246 },
  { userId: 'user-017', bookId: 'brave-new-world',    status: 'finished',    format: 'ebook',     progressPercent: 100, rating: 4 },
  { userId: 'user-017', bookId: 'hunger-games',       status: 'finished',    format: 'physical',  progressPercent: 100, rating: 4 },
  // user-018 Chris: reading way-of-kings
  { userId: 'user-018', bookId: 'way-of-kings',       status: 'reading',     format: 'ebook',     progressPercent: 50, currentPage: 503 },
  { userId: 'user-018', bookId: 'name-of-the-wind',   status: 'finished',    format: 'physical',  progressPercent: 100, rating: 5 },
  { userId: 'user-018', bookId: 'mistborn',           status: 'finished',    format: 'physical',  progressPercent: 100, rating: 5 },
  // user-019 Peyton: reading becoming
  { userId: 'user-019', bookId: 'becoming',           status: 'reading',     format: 'audiobook', progressPercent: 30, currentPage: 134 },
  { userId: 'user-019', bookId: 'educated',           status: 'finished',    format: 'audiobook', progressPercent: 100, rating: 5 },
  // user-020 Rowan: reading piranesi (new reader)
  { userId: 'user-020', bookId: 'piranesi',           status: 'reading',     format: 'physical',  progressPercent: 15, currentPage: 40  },
];

// ── 5. READING ACTIVITIES ──────────────────────────────────────────────────
const activities = [
  { userId: 'user-001', clubId: 'cozy-readers',     type: 'started-book',   bookId: 'dune',              daysAgo: 5  },
  { userId: 'user-001', clubId: 'sci-fi-explorers', type: 'finished-book',  bookId: 'foundation',        daysAgo: 10 },
  { userId: 'user-002', clubId: 'cozy-readers',     type: 'started-book',   bookId: 'pride-and-prejudice', daysAgo: 3 },
  { userId: 'user-002', clubId: 'classic-lit-society', type: 'finished-book', bookId: 'jane-eyre',       daysAgo: 8  },
  { userId: 'user-003', clubId: 'cozy-readers',     type: 'started-book',   bookId: 'gone-girl',         daysAgo: 4  },
  { userId: 'user-003', clubId: 'thriller-den',     type: 'finished-book',  bookId: 'and-then-there-were-none', daysAgo: 12 },
  { userId: 'user-004', clubId: 'cozy-readers',     type: 'started-book',   bookId: 'outlander',         daysAgo: 6  },
  { userId: 'user-005', clubId: 'cozy-readers',     type: 'finished-book',  bookId: 'educated',          daysAgo: 7  },
  { userId: 'user-005', clubId: 'cozy-readers',     type: 'shared-quote',   bookId: 'sapiens',           daysAgo: 2, content: '"The real question that faces us is not what do we want to become, but what do we want to want."' },
  { userId: 'user-006', clubId: 'cozy-readers',     type: 'finished-book',  bookId: 'perks-wallflower',  daysAgo: 9  },
  { userId: 'user-007', clubId: 'thriller-den',     type: 'started-book',   bookId: 'it',                daysAgo: 3  },
  { userId: 'user-007', clubId: 'thriller-den',     type: 'finished-book',  bookId: 'haunting-hill-house', daysAgo: 14 },
  { userId: 'user-008', clubId: 'classic-lit-society', type: 'started-book', bookId: 'beloved',          daysAgo: 5  },
  { userId: 'user-009', clubId: 'cozy-readers',     type: 'shared-quote',   bookId: 'thinking-fast-and-slow', daysAgo: 1, content: '"Nothing in life is as important as you think it is while you are thinking about it."' },
  { userId: 'user-010', clubId: 'thriller-den',     type: 'started-book',   bookId: 'big-sleep',         daysAgo: 4  },
  { userId: 'user-011', clubId: 'sci-fi-explorers', type: 'finished-book',  bookId: 'martian',           daysAgo: 6  },
  { userId: 'user-012', clubId: 'fantasy-fellowship', type: 'finished-book', bookId: 'circe',            daysAgo: 11 },
  { userId: 'user-014', clubId: 'sci-fi-explorers', type: 'started-book',   bookId: 'project-hail-mary', daysAgo: 3  },
  { userId: 'user-015', clubId: 'classic-lit-society', type: 'finished-book', bookId: 'guns-germs-steel', daysAgo: 7 },
  { userId: 'user-017', clubId: 'sci-fi-explorers', type: 'started-book',   bookId: '1984',              daysAgo: 2  },
  { userId: 'user-018', clubId: 'fantasy-fellowship', type: 'started-book', bookId: 'way-of-kings',      daysAgo: 5  },
  { userId: 'user-018', clubId: 'fantasy-fellowship', type: 'finished-book', bookId: 'name-of-the-wind', daysAgo: 15 },
  { userId: 'user-019', clubId: 'cozy-readers',     type: 'joined-club',    daysAgo: 4  },
  { userId: 'user-020', clubId: 'cozy-readers',     type: 'joined-club',    daysAgo: 1  },
  { userId: 'user-020', clubId: 'fantasy-fellowship', type: 'joined-club',  daysAgo: 1  },
];

// ── SEED FUNCTION ──────────────────────────────────────────────────────────
async function seed() {
  console.log('🌱 Starting Kepha seed...\n');

  // 1. Users
  console.log('👤 Seeding users...');
  for (const user of users) {
    await db.collection('users').doc(user.uid).set({
      ...user,
      createdAt: past(30),
      updatedAt: past(1),
    });
    process.stdout.write('.');
  }
  console.log(`\n✅ ${users.length} users seeded\n`);

  // 2. Books
  console.log('📚 Seeding books...');
  for (const book of books) {
    const { id, ...bookData } = book;
    await db.collection('books').doc(id).set({
      ...bookData,
      uploadedBy: 'user-001',
      createdAt: past(60),
    });
    process.stdout.write('.');
  }
  console.log(`\n✅ ${books.length} books seeded\n`);

  // 3. Clubs + member subcollections
  console.log('🏠 Seeding clubs...');
  for (const club of clubs) {
    const { id, memberIds, ...clubData } = club;
    await db.collection('clubs').doc(id).set({
      ...clubData,
      memberIds,
      createdAt: past(20),
    });

    // Create member subcollection docs
    for (const userId of memberIds) {
      const role = userId === club.ownerId ? 'owner' : 'member';
      await db.collection('clubs').doc(id).collection('members').doc(userId).set({
        userId,
        role,
        isOnline: Math.random() > 0.7, // ~30% online
        lastSeen: past(Math.floor(Math.random() * 3)),
        joinedAt: past(Math.floor(Math.random() * 15) + 1),
      });
      process.stdout.write('.');
    }
  }
  console.log(`\n✅ ${clubs.length} clubs seeded\n`);

  // 4. User Books
  console.log('📖 Seeding user books...');
  for (const ub of userBooksData) {
    const book = books.find(b => b.id === ub.bookId);
    await db.collection('userBooks').add({
      ...ub,
      title: book?.title || ub.bookId,
      author: book?.author || '',
      coverUrl: book?.coverUrl || '',
      pageCount: book?.pageCount || null,
      startedAt: ub.status !== 'want-to-read' ? past(Math.floor(Math.random() * 20) + 1) : null,
      finishedAt: ub.status === 'finished' ? past(Math.floor(Math.random() * 10)) : null,
      createdAt: past(Math.floor(Math.random() * 20) + 1),
      updatedAt: past(Math.floor(Math.random() * 3)),
      isPrivate: false,
    });
    process.stdout.write('.');
  }
  console.log(`\n✅ ${userBooksData.length} user book entries seeded\n`);

  // 5. Reading Activities
  console.log('📰 Seeding reading activities...');
  for (const act of activities) {
    const { daysAgo, ...actData } = act;
    await db.collection('readingActivities').add({
      ...actData,
      timestamp: past(daysAgo),
    });
    process.stdout.write('.');
  }
  console.log(`\n✅ ${activities.length} activities seeded\n`);

  console.log('🎉 Seed complete! Your Firestore is ready.\n');
  console.log('Collections created:');
  console.log('  /users          —', users.length, 'documents');
  console.log('  /books          —', books.length, 'documents');
  console.log('  /clubs          —', clubs.length, 'documents');
  console.log('  /userBooks      —', userBooksData.length, 'documents');
  console.log('  /readingActivities —', activities.length, 'documents');
}

seed().catch(console.error).finally(() => process.exit(0));