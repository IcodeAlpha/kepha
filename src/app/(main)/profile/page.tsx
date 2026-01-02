import Image from "next/image";
import { books, clubs, currentUser } from "@/lib/data";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

export default function ProfilePage() {
  const myClubs = clubs.filter((club) => club.memberIds.includes(currentUser.id));
  const readBooks = books.slice(0, 3); // Mock read books

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="items-center text-center">
          <Avatar className="h-24 w-24 mb-4">
            <AvatarImage src={currentUser.avatarUrl} alt={currentUser.name} />
            <AvatarFallback className="text-3xl">
              {currentUser.name.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <CardTitle className="text-3xl">{currentUser.name}</CardTitle>
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
              {myClubs.map((club) => {
                const book = books.find((b) => b.id === club.bookId);
                return (
                  <div key={club.id} className="flex items-center gap-4">
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
                );
              })}
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
