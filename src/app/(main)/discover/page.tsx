'use client';
import Image from "next/image";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Loader2, Search, Sparkles } from "lucide-react";
import { useCollection, useDoc, useFirebase, useUser } from "@/firebase";
import { collection, doc, query, where } from "firebase/firestore";
import type { Book, Club } from "@/lib/types";
import React, { useMemo, useState, useEffect } from "react";
import { getAIRecommendations } from "@/app/actions";
import { Separator } from "@/components/ui/separator";

type RecommendedBook = {
    id: string;
    title: string;
    author: string;
    reason: string;
};

function AIRecommendations() {
    const { firestore } = useFirebase();
    const { user } = useUser();
    const [recommendations, setRecommendations] = useState<RecommendedBook[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    
    const myClubsQuery = useMemoFirebase(() => {
        if (!firestore || !user) return null;
        return query(
        collection(firestore, 'bookClubs'),
        where('memberIds', 'array-contains', user.uid)
        );
    }, [firestore, user]);
    const { data: myClubs } = useCollection<Club>(myClubsQuery);

    const allBooksCollectionRef = useMemoFirebase(
        () => (firestore ? collection(firestore, "books") : null),
        [firestore]
    );
    const { data: allBooks } = useCollection<Book>(allBooksCollectionRef);

    useEffect(() => {
        if (myClubs && allBooks && myClubs.length > 0) {
            const fetchRecommendations = async () => {
                setIsLoading(true);

                const readBookIds = new Set(myClubs.map(club => club.bookId));
                const readBooks = allBooks.filter(book => readBookIds.has(book.id)).map(b => ({ title: b.title, author: b.author }));
                const availableBooks = allBooks.map(b => ({ id: b.id, title: b.title, author: b.author }));

                try {
                    const result = await getAIRecommendations({ readBooks, availableBooks });
                    // Join with allBooks to get coverUrl and coverHint
                    const enrichedRecommendations = result.recommendations.map(rec => {
                        const bookDetails = allBooks.find(b => b.id === rec.id);
                        return { ...rec, ...bookDetails };
                    });
                    setRecommendations(enrichedRecommendations);
                } catch (error) {
                    console.error("Failed to fetch recommendations:", error);
                } finally {
                    setIsLoading(false);
                }
            };
            fetchRecommendations();
        }
    }, [myClubs, allBooks]);

    if (isLoading) {
        return (
            <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Finding books just for you...</span>
            </div>
        )
    }

    if (recommendations.length === 0) {
        return null; // Don't show the section if there are no recommendations
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2">
                <Sparkles className="h-6 w-6 text-primary" />
                <h2 className="text-2xl font-bold">Recommended For You</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {recommendations.map((book) => (
                    <Card key={book.id} className="flex flex-col">
                        <CardHeader className="flex-row items-start gap-4">
                             <Image
                                src={book.coverUrl}
                                alt={`Cover of ${book.title}`}
                                width={80}
                                height={120}
                                className="rounded-md shadow-lg"
                                data-ai-hint={book.coverHint}
                            />
                            <div className="flex-1">
                                <CardTitle>{book.title}</CardTitle>
                                <CardDescription>by {book.author}</CardDescription>
                            </div>
                        </CardHeader>
                        <CardContent className="flex-grow">
                             <p className="text-sm text-muted-foreground italic">"{book.reason}"</p>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    )
}

export default function DiscoverPage() {
  const { firestore } = useFirebase();
  const [searchTerm, setSearchTerm] = useState("");

  const booksCollectionRef = useMemoFirebase(
    () => (firestore ? collection(firestore, "books") : null),
    [firestore]
  );
  const { data: books, isLoading } = useCollection<Book>(booksCollectionRef);

  const filteredBooks = useMemo(() => {
    if (!books) return [];
    return books.filter(book => 
        book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        book.author.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [books, searchTerm]);


  return (
    <div className="space-y-8">
        <AIRecommendations />

        <Separator />
      
        <div className="space-y-6">
            <h2 className="text-2xl font-bold">All Books</h2>
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input 
                    placeholder="Search for books or authors..." 
                    className="pl-10 w-full md:w-1/2 lg:w-1/3" 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {isLoading && <div>Loading books...</div>}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                {filteredBooks?.map((book) => (
                <Card key={book.id} className="overflow-hidden group transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
                    <CardContent className="p-0">
                    <Image
                        src={book.coverUrl}
                        alt={`Cover of ${book.title}`}
                        width={400}
                        height={600}
                        className="w-full h-auto object-cover"
                        data-ai-hint={book.coverHint}
                    />
                    </CardContent>
                    <div className="p-4">
                    <h3 className="font-bold text-md truncate group-hover:text-primary">{book.title}</h3>
                    <p className="text-sm text-muted-foreground">{book.author}</p>
                    </div>
                </Card>
                ))}
            </div>
        </div>
    </div>
  );
}
