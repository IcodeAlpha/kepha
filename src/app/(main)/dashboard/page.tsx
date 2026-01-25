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
import { useUser } from "@/firebase";
import { books, users as mockUsers } from "@/lib/data";
import type { Book, Club, User } from "@/lib/types";

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


function MyClubCard({ club }: { club: Club & { id: string } }) {
  const book = books.find(b => b.id === club.bookId);
  const members = mockUsers.filter(u => club.memberIds.includes(u.id));

  if (!book) return null;

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


export default function DashboardPage() {
  const { user, isUserLoading } = useUser();

  if (isUserLoading) {
    return <div>Loading...</div> // TODO: Skeleton loader
  }

  return (
    <div className="grid gap-6">
       <Card>
        <CardHeader className="items-center text-center">
          <Avatar className="h-24 w-24 mb-4">
            <AvatarImage src={user?.photoURL || 'https://picsum.photos/seed/user-1/100/100'} alt={user?.displayName || 'Alex'} />
            <AvatarFallback className="text-3xl">
              {user?.displayName?.charAt(0) || 'A'}
            </AvatarFallback>
          </Avatar>
          <CardTitle className="text-3xl">Welcome, {user?.displayName || 'Reader'}!</CardTitle>
          <CardDescription>Member since 2024. Here's your book clubs.</CardDescription>
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

       <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Other Clubs</CardTitle>
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
