
'use client';
import Link from "next/link";
import Image from "next/image";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useCollection, useFirebase, useMemoFirebase } from "@/firebase";
import type { Book, Club, User } from "@/lib/types";
import { collection, doc } from "firebase/firestore";
import { useMemo } from "react";
import { useDoc } from "@/firebase/firestore/use-doc";

function ClubCard({ club }: { club: Club & { id: string } }) {
  const { firestore } = useFirebase();

  const bookRef = useMemoFirebase(
    () => (firestore && club.bookId ? doc(firestore, "books", club.bookId) : null),
    [firestore, club.bookId]
  );
  const { data: book } = useDoc<Book>(bookRef);

  const membersCollectionRef = useMemoFirebase(
    () =>
      firestore
        ? collection(firestore, "bookClubs", club.id, "members")
        : null,
    [firestore, club.id]
  );
  const { data: members } = useCollection<User>(membersCollectionRef);

  if (!book) return null; // Or a loading skeleton

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <CardTitle>{club.name}</CardTitle>
        <CardDescription>{club.description}</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow space-y-4">
        <div className="flex items-start gap-4">
          <Image
            src={book.coverUrl}
            alt={`Cover of ${book.title}`}
            width={80}
            height={120}
            className="rounded-md shadow-sm"
            data-ai-hint={book.coverHint}
          />
          <div>
            <p className="text-sm text-muted-foreground">Currently Reading</p>
            <p className="font-semibold">{book.title}</p>
            <p className="text-sm text-muted-foreground">by {book.author}</p>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between items-center">
        <div className="flex items-center -space-x-2">
          {members?.slice(0, 5).map((member) => (
            <Avatar key={member.id} className="border-2 border-card">
              <AvatarImage src={member.avatarUrl} alt={member.name} />
              <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
            </Avatar>
          ))}
          {(members?.length || 0) > 5 && (
            <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-xs font-medium border-2 border-card">
              +{(members?.length || 0) - 5}
            </div>
          )}
        </div>
        <Button asChild>
          <Link href={`/clubs/${club.id}`}>View Club</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}


export default function ClubsPage() {
  const { firestore } = useFirebase();
  const clubsCollectionRef = useMemoFirebase(
    () => (firestore ? collection(firestore, "bookClubs") : null),
    [firestore]
  );
  // Note: This fetches all clubs. For a real app, you'd want public clubs only and pagination.
  const { data: clubs, isLoading } = useCollection<Club>(clubsCollectionRef);

  if (isLoading) {
    return <div>Loading clubs...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Explore Clubs</h1>
        <Button>Create a Club</Button>
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {clubs?.map((club) => (
           <ClubCard key={club.id} club={club} />
        ))}
      </div>
    </div>
  );
}
