
'use client';

import Image from "next/image";
import { notFound } from "next/navigation";
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
import { useMemo } from "react";
import { useCollection, useDoc, useFirebase } from "@/firebase";
import { doc, collection } from "firebase/firestore";
import type { Book, Club, User } from "@/lib/types";

export default function ClubDetailsPage({ params }: { params: { id: string } }) {
  const { firestore } = useFirebase();

  const clubRef = useMemoFirebase(
    () => (firestore ? doc(firestore, "bookClubs", params.id) : null),
    [firestore, params.id]
  );
  const { data: club, isLoading: isClubLoading } = useDoc<Club>(clubRef);

  const bookRef = useMemoFirebase(
    () => (firestore && club?.bookId ? doc(firestore, "books", club.bookId) : null),
    [firestore, club?.bookId]
  );
  const { data: book, isLoading: isBookLoading } = useDoc<Book>(bookRef);

  const membersCollectionRef = useMemoFirebase(
    () =>
      firestore
        ? collection(firestore, "bookClubs", params.id, "members")
        : null,
    [firestore, params.id]
  );
  const { data: clubMembers, isLoading: areMembersLoading } =
    useCollection<User>(membersCollectionRef);

  if (isClubLoading || isBookLoading || areMembersLoading) {
    return <div>Loading...</div>; // TODO: Add skeleton loader
  }

  if (!club || !book) {
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
            <CardContent className="p-6">
              <Accordion type="single" collapsible className="w-full">
                {book.chapters?.map((chapter) => (
                  <AccordionItem value={`chapter-${chapter.id}`} key={chapter.id}>
                    <AccordionTrigger className="text-lg hover:no-underline">
                      Chapter {chapter.chapterNumber}: {chapter.title}
                    </AccordionTrigger>
                    <AccordionContent className="pt-4">
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
