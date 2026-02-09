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
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Plus, Users, BookOpen } from "lucide-react";
import { clubs, getCurrentlyReadingInClub, getClubMembers } from "@/lib/data";

// Current user ID (mocked)
const currentUserId = 'user-1';

function ClubCard({ club, isMember }: { club: typeof clubs[0]; isMember: boolean }) {
  const currentlyReading = getCurrentlyReadingInClub(club.id);
  const members = getClubMembers(club.id);
  
  // Get unique books being read
  const uniqueBooks = currentlyReading
    .filter((cr, index, self) => 
      index === self.findIndex(t => t.book.id === cr.book.id)
    )
    .slice(0, 6);

  return (
    <Card className="flex flex-col hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <CardTitle className="text-xl">{club.name}</CardTitle>
            <CardDescription className="mt-1">{club.description}</CardDescription>
          </div>
          {club.isPublic && (
            <Badge variant="secondary">Public</Badge>
          )}
        </div>
        <div className="flex gap-2 mt-3">
          <Badge variant="outline" className="flex items-center gap-1">
            <Users className="h-3 w-3" />
            {club.memberIds.length}
          </Badge>
          <Badge variant="outline" className="flex items-center gap-1">
            <BookOpen className="h-3 w-3" />
            {currentlyReading.length} reading
          </Badge>
        </div>
        {club.theme && (
          <p className="text-sm text-muted-foreground mt-2">
            📚 {club.theme}
          </p>
        )}
      </CardHeader>

      <CardContent className="flex-grow">
        {/* Show grid of books being read */}
        {uniqueBooks.length > 0 ? (
          <div>
            <p className="text-sm font-medium mb-3">Currently Reading:</p>
            <div className="grid grid-cols-3 gap-2">
              {uniqueBooks.map(({ book }) => (
                <div key={book.id} className="relative group">
                  <Image
                    src={book.coverUrl}
                    alt={book.title}
                    width={100}
                    height={150}
                    className="rounded-md shadow-sm w-full h-auto object-cover"
                    data-ai-hint={book.coverHint}
                  />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-md flex items-center justify-center p-2">
                    <p className="text-white text-xs text-center font-medium line-clamp-2">
                      {book.title}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            {currentlyReading.length > uniqueBooks.length && (
              <p className="text-xs text-muted-foreground mt-2 text-center">
                +{currentlyReading.length - uniqueBooks.length} more
              </p>
            )}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <BookOpen className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No one reading yet</p>
          </div>
        )}

        <Separator className="my-4" />

        {/* Member avatars */}
        <div>
          <p className="text-sm font-medium mb-2">Members:</p>
          <div className="flex items-center -space-x-2">
            {members.slice(0, 5).map((member) => (
              <Avatar key={member.id} className="border-2 border-card">
                <AvatarImage src={member.avatarUrl} alt={member.name} />
                <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
              </Avatar>
            ))}
            {members.length > 5 && (
              <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-xs font-medium border-2 border-card">
                +{members.length - 5}
              </div>
            )}
          </div>
        </div>
      </CardContent>

      <CardFooter className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground italic">
          {club.vibe}
        </p>
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
  const myClubs = clubs.filter(club => club.memberIds.includes(currentUserId));
  const publicClubs = clubs.filter(club => !club.memberIds.includes(currentUserId) && club.isPublic);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Book Clubs</h1>
          <p className="text-muted-foreground mt-1">
            Find your reading community. Everyone reads their own book, together.
          </p>
        </div>
        <Button size="lg">
          <Plus className="h-4 w-4 mr-2" />
          Create a Club
        </Button>
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
          <Card>
            <CardContent className="text-center py-12">
              <Users className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground mb-4">
                You haven't joined any clubs yet.
              </p>
              <p className="text-sm text-muted-foreground mb-4">
                Join a club to share your reading journey with others!
              </p>
              <Button asChild>
                <Link href="#explore">Explore Clubs Below</Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </section>

      <Separator />

      <section className="space-y-4" id="explore">
        <div>
          <h2 className="text-2xl font-bold">Explore Public Clubs</h2>
          <p className="text-muted-foreground mt-1">
            Join a community that matches your reading vibe
          </p>
        </div>
        {publicClubs.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {publicClubs.map((club) => (
              <ClubCard key={club.id} club={club} isMember={false} />
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="text-center py-12">
              <p className="text-muted-foreground">
                No public clubs available right now.
              </p>
            </CardContent>
          </Card>
        )}
      </section>
    </div>
  );
}