// scripts/seed-user.js
// Run with: node scripts/seed-user.js

const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

const UID  = '08z8jNNJvrMqaozyX0U4951W6m62';
const NAME = 'Alpha Munene';
const EMAIL = 'alphamunene5@gmail.com';

const past = (daysAgo) => {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return admin.firestore.Timestamp.fromDate(d);
};

async function run() {
  console.log(`🌱 Seeding data for ${NAME}...\n`);

  // 1. User profile doc
  await db.collection('users').doc(UID).set({
    uid: UID,
    name: NAME,
    email: EMAIL,
    avatarUrl: `https://picsum.photos/seed/${UID}/100/100`,
    bio: 'Avid reader and book club enthusiast. Always looking for the next great read!',
    favoriteGenres: ['Fantasy', 'Sci-Fi', 'Mystery'],
    readingStyle: 'Night owl reader',
    createdAt: past(5),
    updatedAt: past(1),
  });
  console.log('✅ User profile created');

  // 2. Join 3 clubs
  const clubsToJoin = ['cozy-readers', 'sci-fi-explorers', 'fantasy-fellowship'];
  for (const clubId of clubsToJoin) {
    await db.collection('clubs').doc(clubId).update({
      memberIds: admin.firestore.FieldValue.arrayUnion(UID),
    });
    await db.collection('clubs').doc(clubId).collection('members').doc(UID).set({
      userId: UID,
      role: 'member',
      isOnline: true,
      lastSeen: past(0),
      joinedAt: past(2),
    });
    console.log(`✅ Joined ${clubId}`);
  }

  // 3. Books on shelf
  const userBooks = [
    { bookId: 'project-hail-mary', title: 'Project Hail Mary', author: 'Andy Weir',        status: 'reading',      format: 'ebook',     progressPercent: 42, currentPage: 200 },
    { bookId: 'circe',             title: 'Circe',             author: 'Madeline Miller',   status: 'reading',      format: 'physical',  progressPercent: 15, currentPage: 59  },
    { bookId: 'dune',              title: 'Dune',              author: 'Frank Herbert',     status: 'finished',     format: 'ebook',     progressPercent: 100, rating: 5 },
    { bookId: 'mistborn',          title: 'Mistborn',          author: 'Brandon Sanderson', status: 'finished',     format: 'physical',  progressPercent: 100, rating: 4 },
    { bookId: 'educated',          title: 'Educated',          author: 'Tara Westover',     status: 'finished',     format: 'audiobook', progressPercent: 100, rating: 5 },
    { bookId: 'piranesi',          title: 'Piranesi',          author: 'Susanna Clarke',    status: 'want-to-read', format: 'physical',  progressPercent: 0   },
  ];

  for (const ub of userBooks) {
    await db.collection('userBooks').add({
      ...ub,
      userId: UID,
      coverUrl: `https://picsum.photos/seed/${ub.bookId}/400/600`,
      pageCount: null,
      startedAt:  ub.status !== 'want-to-read' ? past(10) : null,
      finishedAt: ub.status === 'finished'      ? past(3)  : null,
      createdAt:  past(10),
      updatedAt:  past(1),
      isPrivate: false,
    });
    console.log(`✅ Added "${ub.title}" (${ub.status})`);
  }

  // 4. Activities
  const activities = [
    { clubId: 'cozy-readers',      type: 'joined-club',   bookId: null,               daysAgo: 2 },
    { clubId: 'sci-fi-explorers',  type: 'joined-club',   bookId: null,               daysAgo: 2 },
    { clubId: 'fantasy-fellowship',type: 'joined-club',   bookId: null,               daysAgo: 2 },
    { clubId: 'sci-fi-explorers',  type: 'started-book',  bookId: 'project-hail-mary', daysAgo: 1 },
    { clubId: 'fantasy-fellowship',type: 'started-book',  bookId: 'circe',             daysAgo: 1 },
    { clubId: 'cozy-readers',      type: 'finished-book', bookId: 'dune',              daysAgo: 3 },
  ];

  for (const { daysAgo, ...act } of activities) {
    await db.collection('readingActivities').add({
      ...act,
      userId: UID,
      timestamp: past(daysAgo),
    });
    console.log(`✅ Activity: ${act.type}`);
  }

  console.log('\n🎉 Done! Alpha Munene is ready.');
  console.log('  Clubs:            cozy-readers, sci-fi-explorers, fantasy-fellowship');
  console.log('  Currently reading: Project Hail Mary, Circe');
  console.log('  Finished:          Dune, Mistborn, Educated');
  console.log('  Want to read:      Piranesi');
}

run().catch(console.error).finally(() => process.exit(0));