
'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { addDocumentNonBlocking, setDocumentNonBlocking, useFirebase } from "@/firebase";
import { books as mockBooks } from "@/lib/data";
import type { Book, Club, User } from "@/lib/types";
import { collection, doc } from "firebase/firestore";
import { useState } from "react";

// Mock users and clubs for seeding
const users: (User & { id: string })[] = [
    { id: 'user-1', name: 'Alex', avatarUrl: 'https://picsum.photos/seed/user-1/100/100' },
    { id: 'user-2', name: 'Brenda', avatarUrl: 'https://picsum.photos/seed/user-2/100/100' },
    { id: 'user-3', name: 'Charlie', avatarUrl: 'https://picsum.photos/seed/user-3/100/100' },
];

const clubs: (Omit<Club, 'id'>)[] = [
    {
        name: 'Dune Disciples',
        description: 'A club for fans of Frank Herbert\'s masterpiece.',
        isPublic: true,
        bookId: 'dune',
        memberIds: ['user-1', 'user-2', 'user-3'],
    },
    {
        name: 'Jane Austen Fans',
        description: 'Discussing the works of Jane Austen.',
        isPublic: true,
        bookId: 'pride-and-prejudice',
        memberIds: ['user-1', 'user-3'],
    }
];


export default function SeedPage() {
    const { firestore } = useFirebase();
    const [isLoading, setIsLoading] = useState(false);
    const [status, setStatus] = useState('idle'); // idle, success, error

    const handleSeed = async () => {
        if (!firestore) {
            setStatus('error');
            console.error("Firestore not available");
            return;
        }

        setIsLoading(true);
        setStatus('idle');

        try {
            // NOTE: We are intentionally NOT using a batch write here.
            // By executing writes individually, we can leverage the custom
            // error handling wrapper (`setDocumentNonBlocking`, etc.) to get
            // detailed, contextual permission errors in the Next.js overlay,
            // which is crucial for debugging security rules.

            // 1. Seed Users
            const usersCollection = collection(firestore, 'users');
            for (const user of users) {
                const userRef = doc(usersCollection, user.id);
                setDocumentNonBlocking(userRef, { name: user.name, avatarUrl: user.avatarUrl }, { merge: false });
            }

            // 2. Seed Books and their chapters/discussions
            const booksCollection = collection(firestore, 'books');
            for (const book of mockBooks) {
                const bookRef = doc(booksCollection, book.id);
                const { chapters, ...bookData } = book;
                setDocumentNonBlocking(bookRef, bookData, { merge: false });

                if (chapters) {
                    for (const chapter of chapters) {
                        const chapterRef = doc(booksCollection, book.id, 'chapters', chapter.id);
                        const { discussion, ...chapterData } = chapter;
                        setDocumentNonBlocking(chapterRef, chapterData, { merge: false });
                        
                        if (discussion) {
                            for (const post of discussion) {
                                const postRef = doc(booksCollection, book.id, 'chapters', chapter.id, 'discussion', post.id);
                                setDocumentNonBlocking(postRef, post, { merge: false });
                            }
                        }
                    }
                }
            }

            // 3. Seed Book Clubs and their members
            const clubsCollection = collection(firestore, 'bookClubs');
            for (const club of clubs) {
                // Firestore will auto-generate an ID if we use `addDoc`
                const clubRef = doc(clubsCollection); // creates a ref with a new ID
                setDocumentNonBlocking(clubRef, club, { merge: false });

                // Add members to subcollection
                for (const memberId of club.memberIds) {
                    const memberUser = users.find(u => u.id === memberId);
                    if (memberUser) {
                        const memberRef = doc(clubRef, 'members', memberId);
                        setDocumentNonBlocking(memberRef, { name: memberUser.name, avatarUrl: memberUser.avatarUrl }, { merge: false });
                    }
                }
            }
            
            // This is optimistic. We won't get an immediate failure signal here.
            // Errors will be thrown by the FirebaseErrorListener if they occur.
            setStatus('success');

        } catch (e) {
            // This catch block will likely not be hit for permission errors with the new setup.
            setStatus('error');
            console.error("An unexpected error occurred during the seed setup:", e);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="container mx-auto max-w-xl py-12">
            <Card>
                <CardHeader>
                    <CardTitle>Seed Database</CardTitle>
                    <CardDescription>
                        Click the button below to populate your Firestore database with the initial
                        mock data for books, clubs, and users. This should only be done once.
                    </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col items-center gap-4">
                    <Button onClick={handleSeed} disabled={isLoading}>
                        {isLoading ? 'Seeding...' : 'Seed Firestore Data'}
                    </Button>
                    {status === 'success' && (
                        <p className="text-green-600">Seeding process initiated! Check your Firestore console.</p>
                    )}
                    {status === 'error' && (
                        <p className="text-red-600">An error occurred. Check the browser console and Next.js terminal for details.</p>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
