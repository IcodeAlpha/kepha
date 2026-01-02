
'use client';
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { useCollection, useFirebase } from "@/firebase";
import { collection } from "firebase/firestore";
import type { Book } from "@/lib/types";
import { useMemo } from "react";

export default function DiscoverPage() {
  const { firestore } = useFirebase();
  const booksCollectionRef = useMemoFirebase(
    () => (firestore ? collection(firestore, "books") : null),
    [firestore]
  );
  const { data: books, isLoading } = useCollection<Book>(booksCollectionRef);

  // TODO: Implement client-side search on the 'books' array.

  return (
    <div className="space-y-6">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input placeholder="Search for books or authors..." className="pl-10 w-full md:w-1/2 lg:w-1/3" />
      </div>

      {isLoading && <div>Loading books...</div>}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
        {books?.map((book) => (
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
  );
}
