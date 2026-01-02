import Link from "next/link";
import Image from "next/image";
import { books, clubs, currentUser, users } from "@/lib/data";
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

export default function DashboardPage() {
  const myClubs = clubs.filter((club) => club.memberIds.includes(currentUser.id));

  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Welcome back, {currentUser.name}!</CardTitle>
          <CardDescription>
            Here's what's happening in your book clubs.
          </CardDescription>
        </CardHeader>
      </Card>
      
      <div className="grid gap-6">
        <h2 className="text-2xl font-bold">My Clubs</h2>
        {myClubs.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {myClubs.map((club) => {
              const book = books.find((b) => b.id === club.bookId);
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
                        {club.memberIds.map(id => {
                           const member = users.find(u => u.id === id);
                           if (!member) return null;
                           return (
                            <Avatar key={id} className="border-2 border-card">
                              <AvatarImage src={member.avatarUrl} alt={member.name} />
                              <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                           )
                        })}
                      </div>
                      <div>
                        <p className="text-sm font-medium mb-1">Reading Progress</p>
                        <Progress value={readingProgress} />
                        <p className="text-xs text-muted-foreground mt-1">{readingProgress}% complete</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
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
