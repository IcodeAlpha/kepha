import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Logo } from "@/components/logo";
import { books } from "@/lib/data";
import { ArrowRight } from "lucide-react";

export default function LandingPage() {
  const featuredBooks = books.slice(0, 4);

  return (
    <div className="flex flex-col min-h-screen">
      <header className="container mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        <Logo />
        <nav className="hidden md:flex items-center space-x-6">
          <Button variant="ghost" asChild>
            <Link href="/discover">Discover</Link>
          </Button>
          <Button variant="ghost" asChild>
            <Link href="/clubs">Clubs</Link>
          </Button>
          <Button asChild>
            <Link href="/dashboard">Enter App</Link>
          </Button>
        </nav>
        <Button className="md:hidden" asChild>
          <Link href="/dashboard">Enter App</Link>
        </Button>
      </header>

      <main className="flex-grow">
        <section className="py-20 md:py-32">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tighter max-w-4xl mx-auto">
              Read Together, Grow Together
            </h1>
            <p className="mt-6 max-w-2xl mx-auto text-lg md:text-xl text-foreground/80">
              Sipha is a social reading platform where people discover books, form clubs, and grow through shared ideas. Turn reading into a shared journey.
            </p>
            <div className="mt-10 flex justify-center gap-4">
              <Button size="lg" asChild>
                <Link href="/clubs">
                  Join a Club <ArrowRight className="ml-2" />
                </Link>
              </Button>
              <Button size="lg" variant="secondary" asChild>
                <Link href="/discover">Discover Books</Link>
              </Button>
            </div>
          </div>
        </section>

        <section className="bg-card py-20 md:py-24">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl md:text-4xl font-bold text-center">Featured Books</h2>
            <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {featuredBooks.map((book) => (
                <Card key={book.id} className="overflow-hidden transition-transform hover:scale-105 hover:shadow-xl">
                  <CardContent className="p-0">
                    <Link href="/discover">
                      <Image
                        src={book.coverUrl}
                        alt={`Cover of ${book.title}`}
                        width={400}
                        height={600}
                        className="w-full h-auto object-cover"
                        data-ai-hint={book.coverHint}
                      />
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-card">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 text-center text-foreground/60">
          <p>&copy; {new Date().getFullYear()} Sipha. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
