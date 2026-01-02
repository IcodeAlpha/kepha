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
import { books, users as mockUsers } from "@/lib/data";
import type { Book, Club, User } from "@/lib/types";
import { Separator } from "@/components/ui/separator";

const allClubs: (Club & { id: string })[] = [
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
        memberIds: ['user-3'],
    }
];

// Assuming the current user is 'user-1'
const currentUserId = 'user-1';

function ClubCard({ club, isMember }: { club: Club & { id: string }, isMember: boolean }) {
  const book = books.find(b => b.id === club.bookId);
  const members = mockUsers.filter(u => club.memberIds.includes(u.id));

  if (!book) return null;

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
        {isMember ? (
            <Button asChild>
                <Link href={`/clubs/${club.id}`}>View Club</Link>
            </Button>
        ) : (
            <Button variant="secondary">Join Club</Button>
        )}
      </CardFooter>
    </Card>
  );
}


export default function ClubsPage() {
  const myClubs = allClubs.filter(club => club.memberIds.includes(currentUserId));
  const publicClubs = allClubs.filter(club => !club.memberIds.includes(currentUserId) && club.isPublic);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Clubs</h1>
        <Button>Create a Club</Button>
      </div>
      
      <section className="space-y-4">
        <h2 className="text-2xl font-bold">My Clubs</h2>
        {myClubs.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {myClubs.map((club) => (
               <ClubCard key={club.id} club={club} isMember={true} />
            ))}
          </div>
        ) : (
            <p className="text-muted-foreground">You haven't joined any clubs yet.</p>
        )}
      </section>

      <Separator />

      <section className="space-y-4">
        <h2 className="text-2xl font-bold">Explore Public Clubs</h2>
         {publicClubs.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {publicClubs.map((club) => (
                <ClubCard key={club.id} club={club} isMember={false} />
                ))}
            </div>
         ) : (
              <p className="text-muted-foreground">There are no public clubs to join right now.</p>
         )}
      </section>
    </div>
  );
}
