'use client';
import Image from "next/image";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Loader2, Search, Upload, Plus } from "lucide-react";
import type { Book, User } from "@/lib/types";
import React, { useState, useEffect, useTransition } from "react";
import { books as allBooks, users as allUsers } from "@/lib/data";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

type CommunityBook = {
    id: string;
    title: string;
    author: string;
    coverUrl: string;
    coverHint: string;
    uploaderId: string;
}

const communityBooks: CommunityBook[] = allBooks.slice(0, 5).map((book, index) => ({
    ...book,
    id: `community-${book.id}`,
    uploaderId: allUsers[index % allUsers.length].id,
}));


function UploadBookDialog({ onBookUploaded }: { onBookUploaded: (book: CommunityBook) => void }) {
    const [title, setTitle] = useState('');
    const [author, setAuthor] = useState('');
    const [image, setImage] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [open, setOpen] = useState(false);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setImage(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = () => {
        if (title && author && preview) {
            const newBook: CommunityBook = {
                id: `community-${Date.now()}`,
                title,
                author,
                coverUrl: preview,
                coverHint: 'custom upload',
                uploaderId: allUsers[0].id, // Mock uploader
            };
            onBookUploaded(newBook);
            // Reset form
            setTitle('');
            setAuthor('');
            setImage(null);
            setPreview(null);
            setOpen(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                 <Button>
                    <Upload className="mr-2" />
                    Upload a Book
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Share What You're Reading</DialogTitle>
                    <DialogDescription>
                        Upload a picture of a book and share it with the community.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="title" className="text-right">Title</Label>
                        <Input id="title" value={title} onChange={e => setTitle(e.target.value)} className="col-span-3" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="author" className="text-right">Author</Label>
                        <Input id="author" value={author} onChange={e => setAuthor(e.target.value)} className="col-span-3" />
                    </div>
                     <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="picture" className="text-right">Picture</Label>
                        <Input id="picture" type="file" onChange={handleImageChange} className="col-span-3" accept="image/*" />
                    </div>
                    {preview && (
                        <div className="col-span-4 flex justify-center">
                            <Image src={preview} alt="Book cover preview" width={150} height={225} className="rounded-md" />
                        </div>
                    )}
                </div>
                <DialogFooter>
                    <Button type="submit" onClick={handleSubmit} disabled={!title || !author || !image}>Upload Book</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

function CommunityBookCard({ book }: { book: CommunityBook }) {
    const uploader = allUsers.find(u => u.id === book.uploaderId);
    if (!uploader) return null;

    return (
        <Card className="overflow-hidden">
            <CardHeader className="flex-row gap-4 items-center p-4">
                 <Avatar>
                    <AvatarImage src={uploader.avatarUrl} alt={uploader.name} />
                    <AvatarFallback>{uploader.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                    <p className="font-semibold">{uploader.name}</p>
                    <p className="text-xs text-muted-foreground">Shared a book</p>
                </div>
            </CardHeader>
            <CardContent className="p-0">
                 <Image
                    src={book.coverUrl}
                    alt={`Cover of ${book.title}`}
                    width={400}
                    height={600}
                    className="w-full h-auto object-cover"
                    data-ai-hint={book.coverHint}
                />
            </CardContent>
            <div className="p-4">
                <h3 className="font-bold text-lg truncate">{book.title}</h3>
                <p className="text-sm text-muted-foreground">{book.author}</p>
                 <Button variant="outline" className="w-full mt-4">
                    <Plus className="mr-2"/>
                    Start a Club
                </Button>
            </div>
        </Card>
    )
}

export default function DiscoverPage() {
  const [books, setBooks] = useState<CommunityBook[]>(communityBooks);

  const handleBookUploaded = (newBook: CommunityBook) => {
      setBooks(prevBooks => [newBook, ...prevBooks]);
  }

  return (
    <div className="space-y-8">
        <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold">Discover</h1>
            <UploadBookDialog onBookUploaded={handleBookUploaded} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {books.map(book => (
                <CommunityBookCard key={book.id} book={book} />
            ))}
        </div>
    </div>
  );
}
