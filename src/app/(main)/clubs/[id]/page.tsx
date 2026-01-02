'use client';

import Image from "next/image";
import { useParams, notFound } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { DiscussionSection } from "@/components/discussion-section";
import type { Book, Club, User } from "@/lib/types";
import { books, users } from "@/lib/data";

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
        memberIds: ['user-1', 'user-3'],
    }
];

export default function ClubDetailsPage() {
  const params = useParams();
  const id = params.id as string;
  const club = allClubs.find(c => c.id === id);
  
  if (!club) {
    return notFound();
  }

  const book = books.find(b => b.id === club.bookId);
  const clubMembers = users.filter(u => club.memberIds.includes(u.id));

  if (!book) {
    return notFound();
  }

  const readingProgress = 33; // Mock progress

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-col md:flex-row items-start gap-6">
          <Image
            src={book.coverUrl}
            alt={`Cover of ${book.title}`}
            width={150}
            height={225}
            className="rounded-lg shadow-lg"
            data-ai-hint={book.coverHint}
          />
          <div className="flex-1">
            <p className="text-sm text-primary font-semibold">Currently Reading</p>
            <CardTitle className="text-4xl mt-1">{book.title}</CardTitle>
            <CardDescription className="text-lg">by {book.author}</CardDescription>
            <Separator className="my-4" />
            <h2 className="text-2xl font-bold">{club.name}</h2>
            <p className="mt-2 text-muted-foreground">{club.description}</p>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <p className="text-sm font-medium">Shared Reading Timeline</p>
            <Progress value={readingProgress} />
            <p className="text-xs text-muted-foreground">
              Chapter {Math.ceil(((book.chapters?.length || 0) * readingProgress) / 100)} of {book.chapters?.length || 0}
            </p>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="discussion">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="discussion">Chapters & Discussion</TabsTrigger>
          <TabsTrigger value="members">Members ({clubMembers?.length || 0})</TabsTrigger>
        </TabsList>
        <TabsContent value="discussion">
          <Card>
            <CardContent className="p-0">
              <Accordion type="single" collapsible className="w-full">
                {book.chapters?.map((chapter, index) => (
                  <AccordionItem value={`chapter-${chapter.id}`} key={chapter.id} className={index === book.chapters.length - 1 ? "border-b-0" : ""}>
                    <AccordionTrigger className="text-lg hover:no-underline px-6 py-4">
                      Chapter {chapter.chapterNumber}: {chapter.title}
                    </AccordionTrigger>
                    <AccordionContent className="border-t">
                      <DiscussionSection chapter={chapter} book={book} />
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="members">
          <Card>
            <CardContent className="p-6 grid gap-4">
              {clubMembers?.map((member) => (
                <div key={member.id} className="flex items-center gap-4">
                  <Avatar>
                    <AvatarImage src={member.avatarUrl} alt={member.name} />
                    <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <p className="font-medium">{member.name}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
