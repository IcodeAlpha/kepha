'use client';

import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Book as BookIcon, Circle } from "lucide-react";
import type { User, Book } from "@/lib/types";

interface CurrentlyReadingMember {
  member: User & { id: string };
  book: Book;
  progress: number;
  isOnline?: boolean;
}

interface CurrentlyReadingProps {
  members: CurrentlyReadingMember[];
}

export function CurrentlyReading({ members }: CurrentlyReadingProps) {
  if (members.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Currently Reading</CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8">
          <BookIcon className="mx-auto h-12 w-12 text-muted-foreground mb-2" />
          <p className="text-muted-foreground">
            No one is reading right now. Be the first to share what you're reading!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Currently Reading ({members.length})</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {members.map(({ member, book, progress, isOnline }) => (
          <div key={member.id} className="flex gap-4 items-start p-3 rounded-lg hover:bg-muted/50 transition-colors">
            <div className="relative">
              <Image
                src={book.coverUrl}
                alt={`Cover of ${book.title}`}
                width={60}
                height={90}
                className="rounded-md shadow-md"
                data-ai-hint={book.coverHint}
              />
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Avatar className="h-6 w-6">
                  <AvatarImage src={member.avatarUrl} alt={member.name} />
                  <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <p className="font-medium text-sm truncate">{member.name}</p>
                {isOnline && (
                  <Circle className="h-2 w-2 fill-green-500 text-green-500" />
                )}
              </div>
              
              <p className="font-semibold text-sm truncate">{book.title}</p>
              <p className="text-xs text-muted-foreground truncate mb-2">
                by {book.author}
              </p>
              
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{progress}% complete</span>
                  {book.pageCount && (
                    <span>{Math.round((progress / 100) * book.pageCount)} / {book.pageCount} pages</span>
                  )}
                </div>
                <Progress value={progress} className="h-1.5" />
              </div>
              
              {book.genre && (
                <Badge variant="secondary" className="mt-2 text-xs">
                  {book.genre}
                </Badge>
              )}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

// Compact grid view alternative
export function CurrentlyReadingGrid({ members }: CurrentlyReadingProps) {
  if (members.length === 0) return null;

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {members.map(({ member, book, progress, isOnline }) => (
        <Card key={member.id} className="overflow-hidden hover:shadow-lg transition-shadow">
          <div className="relative">
            <Image
              src={book.coverUrl}
              alt={`Cover of ${book.title}`}
              width={200}
              height={300}
              className="w-full h-auto object-cover"
              data-ai-hint={book.coverHint}
            />
            <div className="absolute top-2 right-2">
              <Avatar className="h-8 w-8 border-2 border-white shadow-md">
                <AvatarImage src={member.avatarUrl} alt={member.name} />
                <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
              </Avatar>
              {isOnline && (
                <div className="absolute -bottom-1 -right-1 h-3 w-3 bg-green-500 rounded-full border-2 border-white" />
              )}
            </div>
          </div>
          <CardContent className="p-3">
            <p className="font-semibold text-sm truncate">{book.title}</p>
            <p className="text-xs text-muted-foreground truncate mb-2">
              {member.name}
            </p>
            <Progress value={progress} className="h-1" />
            <p className="text-xs text-muted-foreground mt-1">{progress}%</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}