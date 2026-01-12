'use client';

import { useState } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Chip } from './ui/Chip';
import { cn } from '@/lib/utils';
import type { Post } from '@/lib/types';

interface PostPreviewProps {
  post: Post;
  hashtags?: string[];
  showActions?: boolean;
}

export function PostPreview({ post, hashtags = ['#VisitIsrael'], showActions = true }: PostPreviewProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % post.images.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + post.images.length) % post.images.length);
  };

  const isHolyLand = post.style === 'holy_land';

  return (
    <div className="space-y-4">
      {/* Holy Land Badge */}
      {isHolyLand && (
        <div className="flex items-center gap-2">
          <Chip variant="warm" size="md">
            Holy Land Edition
          </Chip>
        </div>
      )}

      {/* Images */}
      {post.images.length <= 3 ? (
        // Grid layout for 1-3 images
        <div
          className={cn(
            'grid gap-2',
            post.images.length === 1 && 'grid-cols-1',
            post.images.length === 2 && 'grid-cols-2',
            post.images.length === 3 && 'grid-cols-3'
          )}
        >
          {post.images.map((image, index) => (
            <div key={index} className="relative aspect-square rounded-xl overflow-hidden bg-gray-100">
              <Image
                src={image}
                alt={`Photo ${index + 1}`}
                fill
                className="object-cover"
              />
            </div>
          ))}
        </div>
      ) : (
        // Carousel for 4+ images
        <div className="relative">
          <div className="relative aspect-square rounded-xl overflow-hidden bg-gray-100">
            <Image
              src={post.images[currentImageIndex]}
              alt={`Photo ${currentImageIndex + 1}`}
              fill
              className="object-cover"
            />
          </div>

          {/* Navigation Buttons */}
          {post.images.length > 1 && (
            <>
              <button
                onClick={prevImage}
                className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors"
                aria-label="Previous image"
              >
                <ChevronLeft size={24} />
              </button>
              <button
                onClick={nextImage}
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors"
                aria-label="Next image"
              >
                <ChevronRight size={24} />
              </button>

              {/* Dots */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                {post.images.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={cn(
                      'w-2 h-2 rounded-full transition-all',
                      index === currentImageIndex
                        ? 'bg-white w-4'
                        : 'bg-white/50'
                    )}
                    aria-label={`Go to image ${index + 1}`}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* Caption */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          {post.tourist_name && <span className="font-medium">{post.tourist_name}</span>}
          <Chip size="sm">{post.location_label}</Chip>
        </div>
        <p className="text-gray-900 whitespace-pre-wrap leading-relaxed">
          {post.experience_text}
        </p>
      </div>

      {/* Verse (Holy Land Edition) */}
      {isHolyLand && post.biblical_verse && (
        <div className="bg-warm/5 border-l-4 border-warm p-4 rounded-r-xl">
          <p className="text-warm text-sm italic leading-relaxed">
            "{post.biblical_verse}"
          </p>
          {post.verse_reference && (
            <p className="text-warm/70 text-xs mt-2">
              — {post.verse_reference}
            </p>
          )}
        </div>
      )}

      {/* Hashtags */}
      <div className="flex flex-wrap gap-2">
        {hashtags.map((tag) => (
          <Chip key={tag} variant="secondary" size="sm">
            {tag}
          </Chip>
        ))}
      </div>
    </div>
  );
}
