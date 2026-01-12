'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { PrimaryButton, SecondaryButton } from '@/components/ui/Button';
import { ImageUploader } from '@/components/ImageUploader';
import { toast } from '@/components/ui/Toast';
import { LOCATIONS } from '@/lib/constants';
import { createPost } from '@/app/actions/createPost';
import { suggestBiblicalVerse, generateStyledImage } from '@/app/actions/generateImage';
import { uploadGeneratedImage } from '@/app/actions/uploadGeneratedImage';
import { ArrowLeft, Send, Loader2, Wand2, ImagePlus } from 'lucide-react';
import type { PostStyle } from '@/lib/types';

interface ChatCreatePostProps {
  guideSlug: string;
}

type Step = 'welcome' | 'upload' | 'description' | 'preparing' | 'style' | 'done';

export function ChatCreatePost({ guideSlug }: ChatCreatePostProps) {
  const router = useRouter();
  const [step, setStep] = useState<Step>('welcome');
  const [images, setImages] = useState<string[]>([]);
  const [location, setLocation] = useState('');
  const [experienceText, setExperienceText] = useState('');
  const [style, setStyle] = useState<PostStyle>('regular');
  const [biblicalVerse, setBiblicalVerse] = useState<string>('');
  const [verseReference, setVerseReference] = useState<string>('');
  const [loadingVerse, setLoadingVerse] = useState(false);
  const [generatingImage, setGeneratingImage] = useState(false);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    const toastId = toast.loading('Creating your post...');

    try {
      const result = await createPost({
        guideSlug,
        touristName: undefined,
        location,
        experienceText: experienceText.trim(),
        style,
        images,
      });

      toast.dismiss(toastId);

      if (result.success && result.postId) {
        setStep('done');
        setTimeout(() => {
          router.push(`/g/${guideSlug}/post/${result.postId}`);
        }, 2000);
      } else {
        toast.error(result.error || 'Failed to create post');
        setLoading(false);
      }
    } catch (error) {
      console.error('Submit error:', error);
      toast.dismiss(toastId);
      toast.error('An unexpected error occurred');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-light/30 to-white pb-20">
      <div className="max-w-2xl mx-auto px-3 py-3 space-y-3">
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1 text-secondary hover:text-primary transition-colors text-sm"
        >
          <ArrowLeft size={16} />
          <span>Back</span>
        </button>

        {/* Step 1: Welcome & Upload */}
        {step === 'welcome' && (
          <>
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center overflow-hidden flex-shrink-0 p-1 shadow-sm">
                <img 
                  src="/Logo.png" 
                  alt="Mary" 
                  className="w-full h-full object-contain"
                />
              </div>
              <Card className="flex-1 bg-white shadow-sm p-3">
                <p className="text-gray-900 text-sm">
                  Share photos from today? Upload moments that stood out to you.
                </p>
              </Card>
            </div>

            <div className="flex items-start gap-2">
              <div className="w-12 flex-shrink-0"></div>
              <div className="flex-1">
                <ImageUploader maxImages={5} onImagesChange={setImages} existingImages={images} />
                {images.length > 0 && (
                  <PrimaryButton
                    onClick={() => setStep('upload')}
                    fullWidth
                    size="md"
                    className="mt-3"
                  >
                    Continue
                  </PrimaryButton>
                )}
              </div>
            </div>
          </>
        )}

        {/* Step 2: Location & Description */}
        {step === 'upload' && (
          <>
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center overflow-hidden flex-shrink-0 p-1 shadow-sm">
                <img 
                  src="/Logo.png" 
                  alt="Mary" 
                  className="w-full h-full object-contain"
                />
              </div>
              <Card className="flex-1 bg-white shadow-sm p-3">
                <p className="text-gray-900 text-sm">
                  Beautiful! 🙏 Tell me in 1-2 lines what this moment meant to you.
                </p>
              </Card>
            </div>

            <div className="flex items-start gap-2">
              <div className="w-12 flex-shrink-0"></div>
              <div className="flex-1 space-y-3">
                <select
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full px-3 py-2 text-sm text-gray-900 bg-white border border-gray-200 rounded-lg focus:border-primary focus:outline-none"
                >
                  <option value="">Where were you?</option>
                  {LOCATIONS.map((loc) => (
                    <option key={loc.id} value={loc.name}>
                      {loc.name}
                    </option>
                  ))}
                </select>

                <textarea
                  placeholder="What did this moment mean to you?"
                  value={experienceText}
                  onChange={(e) => setExperienceText(e.target.value)}
                  maxLength={500}
                  rows={3}
                  className="w-full px-3 py-2 text-sm text-gray-900 bg-white border border-gray-200 rounded-lg focus:border-primary focus:outline-none resize-none placeholder:text-gray-400"
                />

                {location && experienceText.trim().length > 0 && (
                  <PrimaryButton
                    onClick={() => setStep('preparing')}
                    fullWidth
                    size="md"
                    className="gap-2"
                  >
                    <Send size={16} />
                    Send
                  </PrimaryButton>
                )}
              </div>
            </div>
          </>
        )}

        {/* Step 3: Preparing */}
        {step === 'preparing' && (
          <>
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center overflow-hidden flex-shrink-0 p-1 shadow-sm">
                <img 
                  src="/Logo.png" 
                  alt="Mary" 
                  className="w-full h-full object-contain"
                />
              </div>
              <Card className="flex-1 bg-white shadow-sm p-3">
                <p className="text-gray-900 text-sm">
                  Perfect! I&apos;m preparing your post. This will be shared on your guide&apos;s page 
                  as part of the journey.
                </p>
              </Card>
            </div>

            <div className="flex items-start gap-2">
              <div className="w-12 flex-shrink-0"></div>
              <div className="flex-1">
                <PrimaryButton
                  onClick={() => setStep('style')}
                  fullWidth
                  size="md"
                >
                  Continue
                </PrimaryButton>
              </div>
            </div>
          </>
        )}

        {/* Step 4: Style Selection */}
        {step === 'style' && (
          <>
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center overflow-hidden flex-shrink-0 p-1 shadow-sm">
                <img 
                  src="/Logo.png" 
                  alt="Mary" 
                  className="w-full h-full object-contain"
                />
              </div>
              <Card className="flex-1 bg-white shadow-sm p-3">
                <p className="text-gray-900 text-sm">
                  ✨ I can create a beautiful design with a biblical quote that connects to {location}. Would you like that?
                </p>
              </Card>
            </div>

            {biblicalVerse && (
              <div className="flex items-start gap-2">
                <div className="w-12 flex-shrink-0"></div>
                <Card className="flex-1 bg-gradient-to-br from-accent/10 to-warm/10 border border-accent/30 shadow-sm p-3">
                  <div className="space-y-2">
                    <p className="text-sm italic text-gray-700">"{biblicalVerse}"</p>
                    {verseReference && (
                      <p className="text-xs text-gray-500">— {verseReference}</p>
                    )}
                  </div>
                </Card>
              </div>
            )}

            {generatedImageUrl && (
              <div className="flex items-start gap-2">
                <div className="w-12 flex-shrink-0"></div>
                <Card className="flex-1 overflow-hidden shadow-md">
                  <img 
                    src={generatedImageUrl} 
                    alt="AI Generated Post" 
                    className="w-full h-auto rounded-lg"
                  />
                  <div className="p-2 bg-gradient-to-br from-accent/5 to-warm/5">
                    <p className="text-xs text-gray-600 flex items-center gap-1">
                      <ImagePlus size={12} className="text-warm" />
                      Professional image created by Nano Banana Pro
                    </p>
                  </div>
                </Card>
              </div>
            )}

            <div className="flex items-start gap-2">
              <div className="w-12 flex-shrink-0"></div>
              <div className="flex-1 space-y-2">
                <SecondaryButton
                  onClick={async () => {
                    setStyle('holy_land');
                    setLoadingVerse(true);
                    
                    // Generate biblical verse
                    const verseResult = await suggestBiblicalVerse(location, experienceText);
                    if (verseResult.success && verseResult.verse) {
                      setBiblicalVerse(verseResult.verse);
                      setVerseReference(verseResult.reference || '');
                    }
                    
                    setLoadingVerse(false);
                    setGeneratingImage(true);
                    
                    // Generate professional image with Nano Banana Pro
                    // Use the first uploaded image as the base
                    if (images.length > 0) {
                      const imageResult = await generateStyledImage({
                        location,
                        experience: experienceText,
                        style: 'holy_land',
                        biblicalVerse: verseResult.verse,
                        sourceImageUrl: images[0], // Use first uploaded image
                      });
                      
                      if (imageResult.success && imageResult.imageData) {
                        // Upload generated image
                        const timestamp = Date.now();
                        const uploadResult = await uploadGeneratedImage(
                          imageResult.imageData,
                          imageResult.mimeType || 'image/png',
                          `${guideSlug}-${location}-styled-${timestamp}`
                        );
                        
                        if (uploadResult.success && uploadResult.path) {
                          setGeneratedImageUrl(uploadResult.path);
                          toast.success('Beautiful image created! ✨');
                        }
                      }
                    }
                    
                    setGeneratingImage(false);
                    
                    // Wait a moment to show the result, then submit
                    setTimeout(() => {
                      handleSubmit();
                    }, 2000);
                  }}
                  disabled={loading || loadingVerse || generatingImage}
                  fullWidth
                  size="md"
                  className="border-warm text-warm hover:bg-warm hover:text-white"
                >
                  {loadingVerse || generatingImage ? (
                    <>
                      <Loader2 size={16} className="mr-2 animate-spin" />
                      {loadingVerse ? 'Finding verse...' : 'Creating image...'}
                    </>
                  ) : (
                    <>
                      <Wand2 size={16} className="mr-2" />
                      Yes, create with AI ✨
                    </>
                  )}
                </SecondaryButton>
                <SecondaryButton
                  onClick={() => {
                    setStyle('regular');
                    handleSubmit();
                  }}
                  disabled={loading || loadingVerse}
                  fullWidth
                  size="md"
                >
                  No, keep simple
                </SecondaryButton>
              </div>
            </div>
          </>
        )}

        {/* Step 5: Done */}
        {step === 'done' && (
          <div className="flex items-start gap-2">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center overflow-hidden flex-shrink-0 p-1">
              <img 
                src="/Logo.png" 
                alt="Mary" 
                className="w-full h-full object-contain"
              />
            </div>
            <Card className="flex-1 bg-white shadow-sm p-3">
              <p className="text-gray-900 text-sm">
                All set! ✅ Thank you for being part of this journey 🙏
              </p>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
