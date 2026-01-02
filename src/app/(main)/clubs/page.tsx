import Link from "next/link";
import Image from "next/image";
import { books, clubs, users } from "@/lib/data";
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

export default function ClubsPage() {
  const publicClubs = clubs.filter((club) => club.isPublic);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Explore Clubs</h1>
        <Button>Create a Club</Button>
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {publicClubs.map((club) => {
          const book = books.find((b) => b.id === club.bookId);
          if (!book) return null;

          return (
            <Card key={club.id} className="flex flex-col">
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
                  {club.memberIds.slice(0, 5).map((id) => {
                    const member = users.find((u) => u.id === id);
                    if (!member) return null;
                    return (
                      <Avatar key={id} className="border-2 border-card">
                        <AvatarImage src={member.avatarUrl} alt={member.name} />
                        <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                    );
                  })}
                  {club.memberIds.length > 5 && (
                    <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-xs font-medium border-2 border-card">
                      +{club.memberIds.length - 5}
                    </div>
                  )}
                </div>
                <Button asChild>
                  <Link href={`/clubs/${club.id}`}>View Club</Link>
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
