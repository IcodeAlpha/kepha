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
import { useUser } from "@/firebase";
import { books, users as mockUsers } from "@/lib/data";
import type { Book, Club } from "@/lib/types";

const myClubs: (Club & { id: string })[] = [
    {
        id: 'dune-disciples',
        name: 'Dune Disciples',
        description: 'A club for fans of Frank Herbert\'s masterpiece.',
        isPublic: true,
        bookId: 'dune',
        memberIds: ['user-1', 'user-2', 'user-3'],
    },
    {
        id: 'jane-austen-fans',
        name: 'Jane Austen Fans',
        description: 'Discussing the works of Jane Austen.',
        isPublic: true,
        bookId: 'pride-and-prejudice',
        memberIds: ['user-1', 'user-3'],
    }
];

const readBooks = books.slice(0, 3);

export default function ProfilePage() {
  const { user, isUserLoading } = useUser();

  if (isUserLoading) {
    return <div>Loading...</div>
  }
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="items-center text-center">
          <Avatar className="h-24 w-24 mb-4">
            <AvatarImage src={user?.photoURL || 'https://picsum.photos/seed/user-1/100/100'} alt={user?.displayName || 'Alex'} />
            <AvatarFallback className="text-3xl">
              {user?.displayName?.charAt(0) || 'A'}
            </AvatarFallback>
          </Avatar>
          <CardTitle className="text-3xl">{user?.displayName || 'Alex'}</CardTitle>
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
              {readBooks.map((book) => (
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
    const book = books.find(b => b.id === club.bookId);

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
