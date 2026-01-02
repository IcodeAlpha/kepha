
'use client';
import Link from "next/link";
import Image from "next/image";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { useCollection, useDoc, useFirebase, useUser } from "@/firebase";
import { collection, doc, query, where } from "firebase/firestore";
import type { Book, Club, User } from "@/lib/types";
import { useMemo } from "react";

function MyClubCard({ club }: { club: Club & { id: string } }) {
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

  if (!book) return null; // or skeleton

  const readingProgress = Math.floor(Math.random() * 100);

  return (
     <Card key={club.id} className="flex flex-col">
        <CardHeader>
          <CardTitle className="hover:text-primary">
            <Link href={`/clubs/${club.id}`}>{club.name}</Link>
          </CardTitle>
          <CardDescription>Currently reading "{book.title}"</CardDescription>
        </CardHeader>
        <CardContent className="flex-grow flex flex-col justify-between gap-4">
          <Link href={`/clubs/${club.id}`} className="block">
            <Image
              src={book.coverUrl}
              alt={`Cover of ${book.title}`}
              width={200}
              height={300}
              className="rounded-md object-cover mx-auto shadow-lg"
              data-ai-hint={book.coverHint}
            />
          </Link>
          <div className="space-y-2">
              <div className="flex items-center -space-x-2">
              {members?.map(member => (
                  <Avatar key={member.id} className="border-2 border-card">
                    <AvatarImage src={member.avatarUrl} alt={member.name} />
                    <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
                  </Avatar>
              ))}
            </div>
            <div>
              <p className="text-sm font-medium mb-1">Reading Progress</p>
              <Progress value={readingProgress} />
              <p className="text-xs text-muted-foreground mt-1">{readingProgress}% complete</p>
            </div>
          </div>
        </CardContent>
      </Card>
  )
}

export default function DashboardPage() {
  const { firestore } = useFirebase();
  const { user, isUserLoading } = useUser();

  const myClubsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(
      collection(firestore, 'bookClubs'),
      where('memberIds', 'array-contains', user.uid)
    );
  }, [firestore, user]);

  const { data: myClubs, isLoading: areClubsLoading } = useCollection<Club>(myClubsQuery);

  if (isUserLoading || areClubsLoading) {
    return <div>Loading...</div> // TODO: Skeleton loader
  }

  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Welcome back, {user?.displayName || 'Reader'}!</CardTitle>
          <CardDescription>
            Here's what's happening in your book clubs.
          </CardDescription>
        </CardHeader>
      </Card>
      
      <div className="grid gap-6">
        <h2 className="text-2xl font-bold">My Clubs</h2>
        {(myClubs?.length || 0) > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {myClubs?.map((club) => <MyClubCard key={club.id} club={club} />)}
          </div>
        ) : (
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-muted-foreground">You haven't joined any clubs yet.</p>
              <Button asChild className="mt-4">
                <Link href="/clubs">Explore Clubs</Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
