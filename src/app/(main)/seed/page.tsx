
'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useFirebase } from "@/firebase";
import { books as mockBooks } from "@/lib/data";
import type { Book, Club, User } from "@/lib/types";
import { collection, doc, writeBatch } from "firebase/firestore";
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
            const batch = writeBatch(firestore);

            // 1. Seed Users
            const usersCollection = collection(firestore, 'users');
            users.forEach(user => {
                const userRef = doc(usersCollection, user.id);
                batch.set(userRef, { name: user.name, avatarUrl: user.avatarUrl });
            });

            // 2. Seed Books and their chapters/discussions
            const booksCollection = collection(firestore, 'books');
            mockBooks.forEach(book => {
                const bookRef = doc(booksCollection, book.id);
                const { chapters, ...bookData } = book;
                batch.set(bookRef, bookData);

                if (chapters) {
                    chapters.forEach(chapter => {
                        const chapterRef = doc(booksCollection, book.id, 'chapters', chapter.id);
                        const { discussion, ...chapterData } = chapter;
                        batch.set(chapterRef, chapterData);
                        
                        if (discussion) {
                            discussion.forEach(post => {
                                const postRef = doc(booksCollection, book.id, 'chapters', chapter.id, 'discussion', post.id);
                                batch.set(postRef, post);
                            });
                        }
                    });
                }
            });

            // 3. Seed Book Clubs and their members
            const clubsCollection = collection(firestore, 'bookClubs');
            clubs.forEach(club => {
                 // Firestore will auto-generate an ID if we use `addDoc` semantics with a collection ref
                const clubRef = doc(clubsCollection);
                batch.set(clubRef, club);

                // Add members to subcollection
                club.memberIds.forEach(memberId => {
                    const memberUser = users.find(u => u.id === memberId);
                    if (memberUser) {
                        const memberRef = doc(clubRef, 'members', memberId);
                        batch.set(memberRef, { name: memberUser.name, avatarUrl: memberUser.avatarUrl });
                    }
                })
            });
            
            await batch.commit();
            setStatus('success');
        } catch (e) {
            setStatus('error');
            console.error("Error seeding database:", e);
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
                        <p className="text-green-600">Successfully seeded the database!</p>
                    )}
                    {status === 'error' && (
                        <p className="text-red-600">An error occurred. Check the console for details.</p>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
