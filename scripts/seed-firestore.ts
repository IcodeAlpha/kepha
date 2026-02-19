import * as admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import serviceAccount from './serviceAccountKey.json';
 
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount as admin.ServiceAccount)
});
 
const db = getFirestore();
 
async function seed() {
  // ── Books ──────────────────────────────────────────
  const booksData = [
    { id: 'dune', title: 'Dune', author: 'Frank Herbert',
      coverUrl: 'https://picsum.photos/seed/dune/400/600',
      coverHint: 'desert planet', genre: 'Science Fiction', pageCount: 688,
      summary: 'Set on the desert planet Arrakis...' },
    { id: 'pride-and-prejudice', title: 'Pride and Prejudice',
      author: 'Jane Austen', coverUrl: 'https://picsum.photos/seed/pride/400/600',
      coverHint: 'regency era', genre: 'Classic Romance', pageCount: 432,
      summary: 'A romantic novel of manners...' },
    // ... add remaining books from lib/data.ts
  ];
  for (const book of booksData) {
    await db.collection('books').doc(book.id).set({
      ...book, createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
    console.log(`Seeded book: ${book.title}`);
  }
 
  // ── Clubs ──────────────────────────────────────────
  const clubsData = [
    { id: 'cozy-readers', name: 'Cozy Readers Circle',
      description: 'A warm community for readers...',
      vibe: 'Supportive and cozy', isPublic: true,
      memberIds: [], // will be populated when real users join
      ownerId: '',  // update with real UID after first sign-up
      theme: 'All genres welcome',
    },
  ];
  for (const club of clubsData) {
    await db.collection('clubs').doc(club.id).set({
      ...club, createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
    console.log(`Seeded club: ${club.name}`);
  }
 
  console.log('Seed complete!');
}
 
seed().catch(console.error).finally(() => process.exit(0));
