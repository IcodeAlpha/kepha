'use client';
import Image from "next/image";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Loader2, Search, Sparkles } from "lucide-react";
import type { Book } from "@/lib/types";
import React, { useState, useEffect, useTransition } from "react";
import { getAIRecommendations, searchBooks } from "@/app/actions";
import { Separator } from "@/components/ui/separator";
import { books as allBooks } from "@/lib/data";

type RecommendedBook = {
    id: string;
    title: string;
    author: string;
    reason: string;
    coverUrl: string;
    coverHint: string;
};

// Mock user's reading history
const myReadBooks = [
    { title: 'Dune', author: 'Frank Herbert' },
];

function AIRecommendations() {
    const [recommendations, setRecommendations] = useState<RecommendedBook[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    
    useEffect(() => {
        const fetchRecommendations = async () => {
            setIsLoading(true);

            const availableBooks = allBooks.map(b => ({ id: b.id, title: b.title, author: b.author }));

            try {
                const result = await getAIRecommendations({ readBooks: myReadBooks, availableBooks });
                const enrichedRecommendations = result.recommendations.map(rec => {
                    const bookDetails = allBooks.find(b => b.id === rec.id);
                    return { ...rec, ...bookDetails };
                }) as RecommendedBook[];
                setRecommendations(enrichedRecommendations);
            } catch (error) {
                console.error("Failed to fetch recommendations:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchRecommendations();
    }, []);

    if (isLoading) {
        return (
            <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Finding books just for you...</span>
            </div>
        )
    }

    if (recommendations.length === 0) {
        return null; 
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
  const [searchTerm, setSearchTerm] = useState("");
  const [displayedBooks, setDisplayedBooks] = useState<Book[]>([]);
  const [isSearching, startSearchTransition] = useTransition();

  useEffect(() => {
    // Fetch initial books on mount
    const fetchInitialBooks = async () => {
      startSearchTransition(async () => {
        const results = await searchBooks('classic literature');
        setDisplayedBooks(results);
      });
    };
    fetchInitialBooks();
  }, []);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchTerm(query);
    startSearchTransition(async () => {
        if (query.trim().length > 2) {
            const results = await searchBooks(query);
            setDisplayedBooks(results);
        } else if (query.trim().length === 0) {
            // Optional: revert to initial list when search is cleared
            const results = await searchBooks('classic literature');
            setDisplayedBooks(results);
        }
    });
  }

  return (
    <div className="space-y-8">
        <AIRecommendations />

        <Separator />
      
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                 <h2 className="text-2xl font-bold">{searchTerm.trim() === '' ? 'Featured Books' : 'Search Results'}</h2>
                {isSearching && <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />}
            </div>
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input 
                    placeholder="Search for books or authors..." 
                    className="pl-10 w-full md:w-1/2 lg:w-1/3" 
                    value={searchTerm}
                    onChange={handleSearch}
                />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                {displayedBooks?.map((book) => (
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
            {searchTerm.length > 0 && displayedBooks.length === 0 && !isSearching && (
                <p className="text-muted-foreground">No books found for "{searchTerm}".</p>
            )}
             {displayedBooks.length === 0 && isSearching && (
                 Array.from({ length: 10 }).map((_, i) => (
                    <div key={i} className="animate-pulse rounded-lg bg-muted h-64"></div>
                ))
            )}
        </div>
    </div>
  );
}
