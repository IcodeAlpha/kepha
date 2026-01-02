'use client';
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Loader2, Search } from "lucide-react";
import type { Book } from "@/lib/types";
import React, { useState, useEffect, useTransition } from "react";
import { books as allBooks } from "@/lib/data";

export default function DiscoverPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [displayedBooks, setDisplayedBooks] = useState<Book[]>(allBooks);
  const [isSearching, startSearchTransition] = useTransition();

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchTerm(query);
    startSearchTransition(() => {
        if (query.trim().length > 0) {
            const results = allBooks.filter(book => 
                book.title.toLowerCase().includes(query.toLowerCase()) ||
                book.author.toLowerCase().includes(query.toLowerCase())
            );
            setDisplayedBooks(results);
        } else {
            setDisplayedBooks(allBooks);
        }
    });
  }

  return (
    <div className="space-y-8">
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                 <h2 className="text-2xl font-bold">{searchTerm.trim() === '' ? 'All Books' : 'Search Results'}</h2>
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
