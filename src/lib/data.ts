
import type { User, Book, Club, Chapter, DiscussionPost } from './types';

export const users: (User & { id: string })[] = [
    { id: 'user-1', name: 'Alex', avatarUrl: 'https://picsum.photos/seed/user-1/100/100' },
    { id: 'user-2', name: 'Brenda', avatarUrl: 'https://picsum.photos/seed/user-2/100/100' },
    { id: 'user-3', name: 'Charlie', avatarUrl: 'https://picsum.photos/seed/user-3/100/100' },
];

const defaultDiscussion: DiscussionPost[] = [
    { id: 'd-1-1', userId: 'user-2', content: "What a powerful opening! The sense of foreboding is palpable.", timestamp: '2024-05-20T10:00:00Z', replies: []},
    { id: 'd-1-2', userId: 'user-3', content: "I agree. The political intrigue is set up so well from the very first page.", timestamp: '2024-05-20T11:30:00Z', replies: [
        { id: 'd-1-2-1', userId: 'user-1', content: "Definitely! I'm already hooked on the Harkonnen vs. Atreides conflict.", timestamp: '2024-05-20T12:00:00Z', replies: []}
    ]},
];

const duneChapters: Chapter[] = [
    { id: 'dune-1', title: 'A Beginning', chapterNumber: 1, content: 'The story begins on the planet Caladan, home of House Atreides. The young heir, Paul Atreides, is about to undergo a test by the Bene Gesserit Reverend Mother Gaius Helen Mohiam. The test, a trial of pain and self-control, is meant to determine if Paul is the Kwisatz Haderach, a superbeing the Bene Gesserit have been trying to breed for generations. Paul passes the test, revealing his potential. The chapter also establishes the political landscape: the Padishah Emperor Shaddam IV has ordered House Atreides to leave their ancestral home of Caladan and take over the fiefdom of the desert planet Arrakis, the universe\'s only source of the priceless spice melange. This move is a trap, orchestrated by the Emperor and the Atreides\' mortal enemies, House Harkonnen, to destroy them.', discussion: defaultDiscussion },
    { id: 'dune-2', title: 'The Spice', chapterNumber: 2, content: 'Paul\'s training in the Bene Gesserit ways, known as "the weirding way," is intensified. He learns about the spice melange, its properties that extend life and expand consciousness, and its critical role in the spacing guild\'s navigation. The family prepares for their move to Arrakis, a dangerous desert planet also known as Dune. The sense of an impending trap looms large over the House.', discussion: [] },
    { id: 'dune-3', title: 'Arrakis', chapterNumber: 3, content: 'The Atreides family arrives on Arrakis. They are greeted by the harsh, water-scarce environment and the native Fremen people, who have a deep, spiritual connection to the desert and the giant sandworms that produce the spice. Duke Leto, Paul\'s father, tries to form an alliance with the Fremen, seeing them as a powerful potential ally against the Harkonnens.', discussion: [] },
];

const prideAndPrejudiceChapters: Chapter[] = [
    { id: 'pnp-1', title: 'Chapter 1', chapterNumber: 1, content: 'It is a truth universally acknowledged, that a single man in possession of a good fortune, must be in want of a wife. The chapter introduces the Bennet family, particularly Mrs. Bennet, who is desperate to marry off one of her five daughters to the wealthy Mr. Bingley, who has just rented the nearby Netherfield Park.', discussion: [] },
    { id: 'pnp-2', title: 'Chapter 2', chapterNumber: 2, content: 'Mr. Bennet reveals he has already paid a visit to Mr. Bingley, much to the delight of his wife and daughters. This sets the stage for the family\'s first social encounter with the newcomer.', discussion: [] },
];

const theHobbitChapters: Chapter[] = [
    { id: 'hobbit-1', title: 'An Unexpected Party', chapterNumber: 1, content: 'In a hole in the ground there lived a hobbit. Not a nasty, dirty, wet hole, filled with the ends of worms and an oozy smell, nor yet a dry, bare, sandy hole with nothing in it to sit down on or to eat: it was a hobbit-hole, and that means comfort. This hobbit was Bilbo Baggins. One day, the wizard Gandalf visits and marks his door. Soon after, a company of thirteen dwarves, led by Thorin Oakenshield, unexpectedly arrives for a party, drawing the respectable, comfort-loving Bilbo into a grand and dangerous adventure.', discussion: [] },
];


export const books: Book[] = [
  {
    id: 'dune',
    title: 'Dune',
    author: 'Frank Herbert',
    coverUrl: 'https://picsum.photos/seed/dune/400/600',
    coverHint: 'desert planet',
    summary: 'Set on the desert planet Arrakis, Dune is the story of the boy Paul Atreides, heir to a noble family tasked with ruling an inhospitable world where the only thing of value is the “spice” melange, a drug capable of extending life and enhancing consciousness.',
    chapters: duneChapters,
  },
  {
    id: 'pride-and-prejudice',
    title: 'Pride and Prejudice',
    author: 'Jane Austen',
    coverUrl: 'https://picsum.photos/seed/pride/400/600',
    coverHint: 'regency era',
    summary: 'A romantic novel of manners that tells the story of the emotional development of the protagonist, Elizabeth Bennet, who learns the error of making hasty judgments and comes to appreciate the difference between the superficial and the essential.',
    chapters: prideAndPrejudiceChapters,
  },
  {
    id: 'the-hobbit',
    title: 'The Hobbit',
    author: 'J.R.R. Tolkien',
    coverUrl: 'https://picsum.photos/seed/hobbit/400/600',
    coverHint: 'fantasy landscape',
    summary: 'A fantasy novel and children\'s book about a hobbit named Bilbo Baggins. He is swept into an epic quest to reclaim the lost Dwarf Kingdom of Erebor from the fearsome dragon Smaug.',
    chapters: theHobbitChapters,
  },
  {
    id: 'moby-dick',
    title: 'Moby Dick',
    author: 'Herman Melville',
    coverUrl: 'https://picsum.photos/seed/whale/400/600',
    coverHint: 'ocean storm',
    summary: 'The narrative of the sailor Ishmael\'s pensive voyage in the whaling ship Pequod, commanded by Captain Ahab. Ahab has one purpose: to seek revenge on Moby Dick, a ferocious, enigmatic white sperm whale that on a previous voyage destroyed his ship and severed his leg at the knee.',
    chapters: [],
  },
  {
    id: 'sapiens',
    title: 'Sapiens: A Brief History of Humankind',
    author: 'Yuval Noah Harari',
    coverUrl: 'https://picsum.photos/seed/sapiens/400/600',
    coverHint: 'ancient human',
    summary: 'A book that surveys the history of humankind, from the Stone Age to the twenty-first century.',
    chapters: [],
  },
  {
    id: 'atomic-habits',
    title: 'Atomic Habits',
    author: 'James Clear',
    coverUrl: 'https://picsum.photos/seed/habits/400/600',
    coverHint: 'gears abstract',
    summary: 'An easy and proven way to build good habits and break bad ones.',
    chapters: [],
  },
    {
    id: 'the-martian',
    title: 'The Martian',
    author: 'Andy Weir',
    coverUrl: 'https://picsum.photos/seed/martian/400/600',
    coverHint: 'mars landscape',
    summary: 'An astronaut becomes stranded on Mars after his team assumes him dead, and must rely on his ingenuity to find a way to signal to Earth that he is alive.',
    chapters: [],
  },
  {
    id: 'circe',
    title: 'Circe',
    author: 'Madeline Miller',
    coverUrl: 'https://picsum.photos/seed/circe/400/600',
    coverHint: 'greek mythology',
    summary: 'A feminist retelling of the Greek myth of Circe, the goddess of magic.',
    chapters: [],
  },
];
