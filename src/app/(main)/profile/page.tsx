
'use client';
import Image from "next/image";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useCollection, useDoc, useFirebase, useUser, useMemoFirebase } from "@/firebase";
import { collection, doc, query, where } from "firebase/firestore";
import type { Book, Club } from "@/lib/types";
import { useMemo }from "react";

export default function ProfilePage() {
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
  
  // Mock read books for now
  const readBooksCollectionRef = useMemoFirebase(
    () => (firestore ? collection(firestore, "books") : null),
    [firestore]
  );
  const { data: readBooks } = useCollection<Book>(readBooksCollectionRef);


  if (isUserLoading || areClubsLoading) {
    return <div>Loading...</div>
  }
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="items-center text-center">
          <Avatar className="h-24 w-24 mb-4">
            <AvatarImage src={user?.photoURL || ''} alt={user?.displayName || ''} />
            <AvatarFallback className="text-3xl">
              {user?.displayName?.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <CardTitle className="text-3xl">{user?.displayName}</CardTitle>
          <CardDescription>Member since 2024</CardDescription>
        </CardHeader>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>My Clubs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {myClubs?.map((club) => (
                  <ClubListItem key={club.id} club={club} />
              ))}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Reading History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {readBooks?.slice(0,3).map((book) => (
                <div key={book.id}>
                  <p className="font-semibold">{book.title}</p>
                  <p className="text-sm text-muted-foreground">{book.author}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


function ClubListItem({ club }: { club: Club }) {
    const { firestore } = useFirebase();
    const bookRef = useMemoFirebase(
      () => (firestore && club.bookId ? doc(firestore, "books", club.bookId) : null),
      [firestore, club.bookId]
    );
    const { data: book } = useDoc<Book>(bookRef);

    return (
        <div className="flex items-center gap-4">
        <Image
            src={book?.coverUrl || ""}
            alt={book?.title || ""}
            width={40}
            height={60}
            className="rounded-sm"
            data-ai-hint={book?.coverHint}
        />
        <div>
            <p className="font-semibold">{club.name}</p>
            <p className="text-sm text-muted-foreground">
            Reading: {book?.title}
            </p>
        </div>
        </div>
    )
}
