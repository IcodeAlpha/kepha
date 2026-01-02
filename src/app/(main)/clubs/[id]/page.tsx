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
import type { Book, Club, User, Chapter } from "@/lib/types";
import { books, users } from "@/lib/data";
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PlusCircle } from "lucide-react";

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

function AddChapterDialog({ onChapterAdded }: { onChapterAdded: (chapter: Chapter) => void }) {
    const [open, setOpen] = useState(false);
    const [title, setTitle] = useState('');
    const [number, setNumber] = useState('');
    const [content, setContent] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!title || !number || !content) return;

        const newChapter: Chapter = {
            id: `chapter-${Date.now()}`,
            title,
            chapterNumber: parseInt(number, 10),
            content,
            discussion: [],
        };
        onChapterAdded(newChapter);
        
        // Reset form and close dialog
        setTitle('');
        setNumber('');
        setContent('');
        setOpen(false);
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline">
                    <PlusCircle className="mr-2" />
                    Add Chapter
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Add a New Chapter</DialogTitle>
                    <DialogDescription>
                        Fill in the details for the new chapter. This will be visible to all club members.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                  <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="chapter-number" className="text-right">
                              Number
                          </Label>
                          <Input
                              id="chapter-number"
                              type="number"
                              value={number}
                              onChange={(e) => setNumber(e.target.value)}
                              className="col-span-3"
                          />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="chapter-title" className="text-right">
                              Title
                          </Label>
                          <Input
                              id="chapter-title"
                              value={title}
                              onChange={(e) => setTitle(e.target.value)}
                              className="col-span-3"
                          />
                      </div>
                      <div className="grid grid-cols-4 items-start gap-4">
                          <Label htmlFor="chapter-content" className="text-right mt-2">
                              Content
                          </Label>
                          <Textarea
                              id="chapter-content"
                              value={content}
                              onChange={(e) => setContent(e.target.value)}
                              className="col-span-3"
                              rows={10}
                              placeholder="Paste the chapter text here..."
                          />
                      </div>
                  </div>
                  <DialogFooter>
                      <Button type="submit">Add Chapter</Button>
                  </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

export default function ClubDetailsPage() {
  const params = useParams();
  const id = params.id as string;
  const club = allClubs.find(c => c.id === id);
  
  if (!club) {
    return notFound();
  }

  const bookTemplate = books.find(b => b.id === club.bookId);
  const clubMembers = users.filter(u => club.memberIds.includes(u.id));
  
  // Use state to manage the book, allowing chapters to be added dynamically
  const [book, setBook] = useState(bookTemplate);

  if (!book) {
    return notFound();
  }
  
  const handleChapterAdded = (newChapter: Chapter) => {
    const updatedChapters = [...(book.chapters || []), newChapter];
    updatedChapters.sort((a, b) => a.chapterNumber - b.chapterNumber);
    setBook({ ...book, chapters: updatedChapters });
  };


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
            <CardHeader>
              <div className="flex justify-between items-center">
                  <CardTitle>Chapters</CardTitle>
                  <AddChapterDialog onChapterAdded={handleChapterAdded} />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Accordion type="single" collapsible className="w-full">
                {book.chapters && book.chapters.length > 0 ? (
                    book.chapters.map((chapter, index) => (
                    <AccordionItem value={`chapter-${chapter.id}`} key={chapter.id} className={index === book.chapters.length - 1 ? "border-b-0" : ""}>
                        <AccordionTrigger className="text-lg hover:no-underline px-6 py-4">
                        Chapter {chapter.chapterNumber}: {chapter.title}
                        </AccordionTrigger>
                        <AccordionContent className="border-t">
                          <DiscussionSection chapter={chapter} book={book} />
                        </AccordionContent>
                    </AccordionItem>
                    ))
                ) : (
                    <div className="text-center text-muted-foreground p-8">
                        <p>No chapters have been added for this book yet.</p>
                        <p className="text-sm">Be the first to add one!</p>
                    </div>
                )}
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

    