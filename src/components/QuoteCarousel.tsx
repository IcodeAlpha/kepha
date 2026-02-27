'use client';

import React from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination } from 'swiper/modules';
import { Star } from 'lucide-react';
import 'swiper/css';
import 'swiper/css/pagination';

interface Quote {
  id: number;
  text: string;
  author: string;
  bookTitle: string;
  bookAuthor: string;
  rating: number;
  gradient: string;
}

const mockQuotes: Quote[] = [
  {
    id: 1,
    text: "It was the best of times, it was the worst of times, it was the age of wisdom, it was the age of foolishness.",
    author: "Sarah Chen",
    bookTitle: "A Tale of Two Cities",
    bookAuthor: "Charles Dickens",
    rating: 5,
    gradient: "from-indigo-500 via-purple-500 to-pink-500"
  },
  {
    id: 2,
    text: "Call me Ishmael. Some years ago—never mind how long precisely—having little or no money in my purse, I thought I would sail about a little and see the watery part of the world.",
    author: "Marcus Rodriguez",
    bookTitle: "Moby Dick",
    bookAuthor: "Herman Melville",
    rating: 5,
    gradient: "from-blue-500 via-cyan-500 to-teal-500"
  },
  {
    id: 3,
    text: "It is a truth universally acknowledged, that a single man in possession of a good fortune, must be in want of a wife.",
    author: "Emma Thompson",
    bookTitle: "Pride and Prejudice",
    bookAuthor: "Jane Austen",
    rating: 5,
    gradient: "from-orange-400 via-red-500 to-pink-600"
  },
  {
    id: 4,
    text: "Mother died today. Or maybe yesterday; I can't be sure. The porter at the old people's home said it was today.",
    author: "James Liu",
    bookTitle: "The Stranger",
    bookAuthor: "Albert Camus",
    rating: 5,
    gradient: "from-green-400 via-emerald-500 to-teal-600"
  },
  {
    id: 5,
    text: "You don't know about me without you have read a book by the name of The Adventures of Tom Sawyer; but that ain't no matter.",
    author: "Isabella Rossi",
    bookTitle: "The Adventures of Huckleberry Finn",
    bookAuthor: "Mark Twain",
    rating: 5,
    gradient: "from-rose-400 via-pink-500 to-red-600"
  }
];

export default function QuoteCarousel() {
  const swiperRef = React.useRef(null);

  const StarRating = ({ rating }: { rating: number }) => (
    <div className="flex gap-1">
      {[...Array(5)].map((_, i) => (
        <Star
          key={i}
          size={16}
          className={i < rating ? "fill-white text-white" : "text-white/30"}
        />
      ))}
    </div>
  );

  return (
    <div className="w-full py-12 px-4 md:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-10 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
            What Readers Are Saying
          </h2>
          <p className="text-gray-600 text-lg">
            Join thousands of book lovers sharing their thoughts
          </p>
        </div>

        {/* Carousel Container */}
        <div className="relative">
          <Swiper
            ref={swiperRef}
            modules={[Pagination]}
            spaceBetween={24}
            slidesPerView={1}
            breakpoints={{
              640: { slidesPerView: 2 },
              1024: { slidesPerView: 3 },
            }}
            pagination={{
              clickable: true,
              dynamicBullets: true,
            }}
            className="pb-12 swiper-beige-dots"
          >
            {mockQuotes.map((quote) => (
              <SwiperSlide key={quote.id}>
                <div
                  className={`bg-gradient-to-br ${quote.gradient} rounded-2xl p-8 h-96 flex flex-col justify-between shadow-xl hover:shadow-2xl transition-shadow duration-300 transform hover:scale-105 transition-transform`}
                >
                  {/* Quote Text */}
                  <div className="mb-6 overflow-hidden">
                    <p className="text-white text-lg leading-relaxed font-medium line-clamp-6">
                      &ldquo;{quote.text}&rdquo;
                    </p>
                  </div>

                  {/* Author & Book Info */}
                  <div className="space-y-4 border-t border-white/20 pt-6">
                    <div>
                      <p className="text-white font-semibold text-base">
                        {quote.author}
                      </p>
                      <p className="text-white/80 text-sm mt-1">
                        {quote.bookTitle}{' '}
                        <span className="text-white/60">by {quote.bookAuthor}</span>
                      </p>
                    </div>
                    <StarRating rating={quote.rating} />
                  </div>
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      </div>

      <style jsx>{`
        :global(.swiper-beige-dots .swiper-pagination-bullet) {
          background-color: #d4b896;
          opacity: 0.5;
        }

        :global(.swiper-beige-dots .swiper-pagination-bullet-active) {
          background-color: #c9a97a;
          opacity: 1;
        }
      `}</style>
    </div>
  );
}