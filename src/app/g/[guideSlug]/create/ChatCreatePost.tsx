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

type Step = 'welcome' | 'upload' | 'description' | 'preparing' | 'style' | 'preview' | 'done';

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
  const [createdPostId, setCreatedPostId] = useState<string>('');

  const handleSubmit = async () => {
    setLoading(true);
    const toastId = toast.loading('Creating your post...');

    try {
      // Use generated image if available, otherwise use original images
      const finalImages = generatedImageUrl ? [generatedImageUrl] : images;
      
      console.log('📝 Creating post with images:', finalImages);
      console.log('🎨 Using generated image:', !!generatedImageUrl);
      
      const result = await createPost({
        guideSlug,
        touristName: undefined,
        location,
        experienceText: experienceText.trim(),
        style,
        images: finalImages,
        biblicalVerse: biblicalVerse || undefined,
        verseReference: verseReference || undefined,
      });

      toast.dismiss(toastId);

      if (result.success && result.postId) {
        setCreatedPostId(result.postId);
        setStep('done');
        toast.success('Post created successfully! ✨');
      } else {
        toast.error(result.error || 'Failed to create post');
        setLoading(false);
      }
    } catch (error) {
      console.error('Submit error:', error);
      toast.dismiss(toastId);
      toast.error('An unexpected error occurred');
      setLoading(false);
    } finally {
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
                    console.log('🎨 Starting image generation...');
                    if (images.length > 0) {
                      try {
                        console.log('📸 Source image:', images[0]);
                        const imageResult = await generateStyledImage({
                          location,
                          experience: experienceText,
                          style: 'holy_land',
                          biblicalVerse: verseResult.verse,
                          sourceImageUrl: images[0], // Use first uploaded image
                        });
                        
                        console.log('🖼️ Image generation result:', { success: imageResult.success, hasData: !!imageResult.imageData });
                        
                        if (imageResult.success && imageResult.imageData) {
                          // Upload generated image
                          console.log('☁️ Uploading generated image...');
                          const timestamp = Date.now();
                          const uploadResult = await uploadGeneratedImage(
                            imageResult.imageData,
                            imageResult.mimeType || 'image/png',
                            `${guideSlug}-${location}-styled-${timestamp}`
                          );
                          
                          console.log('📤 Upload result:', uploadResult);
                          
                          if (uploadResult.success && uploadResult.path) {
                            setGeneratedImageUrl(uploadResult.path);
                            toast.success('Beautiful image created! ✨');
                          } else {
                            console.error('❌ Upload failed:', uploadResult.error);
                            toast.error('Failed to upload generated image');
                          }
                        } else {
                          console.error('❌ Image generation failed:', imageResult.error);
                          toast.error('Failed to generate styled image');
                        }
                      } catch (error) {
                        console.error('💥 Image generation error:', error);
                        toast.error('Image generation failed: ' + (error as Error).message);
                      }
                    }
                    
                    setGeneratingImage(false);
                    console.log('🏁 Image generation process ended');
                    
                    // Move to preview step to show the generated image
                    if (generatedImageUrl) {
                      setStep('preview');
                    }
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

        {/* Step 5: Preview Generated Image */}
        {step === 'preview' && (
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
                  ✨ Here's your beautiful image! Take a moment to see how it looks.
                </p>
              </Card>
            </div>

            {/* Display Generated Image */}
            {generatedImageUrl && (
              <div className="flex items-start gap-2">
                <div className="w-12 flex-shrink-0"></div>
                <Card className="flex-1 overflow-hidden shadow-lg">
                  <img 
                    src={generatedImageUrl} 
                    alt="AI Generated Post" 
                    className="w-full h-auto"
                  />
                </Card>
              </div>
            )}

            {/* Verse Display */}
            {biblicalVerse && (
              <div className="flex items-start gap-2">
                <div className="w-12 flex-shrink-0"></div>
                <Card className="flex-1 bg-gradient-to-br from-warm/10 to-accent/5 border border-warm/30 shadow-sm p-4">
                  <p className="text-sm italic text-gray-700 mb-2">"{biblicalVerse}"</p>
                  {verseReference && (
                    <p className="text-xs text-warm font-medium">— {verseReference}</p>
                  )}
                </Card>
              </div>
            )}

            {/* Continue Button */}
            <div className="flex items-start gap-2">
              <div className="w-12 flex-shrink-0"></div>
              <div className="flex-1">
                <PrimaryButton
                  onClick={handleSubmit}
                  disabled={loading}
                  fullWidth
                  size="lg"
                  className="bg-gradient-to-r from-warm to-accent hover:from-warm/90 hover:to-accent/90"
                >
                  {loading ? (
                    <>
                      <Loader2 size={18} className="mr-2 animate-spin" />
                      Creating Post...
                    </>
                  ) : (
                    <>
                      <Send size={18} className="mr-2" />
                      Perfect! Create My Post
                    </>
                  )}
                </PrimaryButton>
              </div>
            </div>
          </>
        )}

        {/* Step 6: Done */}
        {step === 'done' && (
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
                  All set! ✅ Thank you for being part of this journey 🙏
                </p>
              </Card>
            </div>

            {/* View Post Button */}
            {createdPostId && (
              <div className="flex items-start gap-2">
                <div className="w-12 flex-shrink-0"></div>
                <div className="flex-1">
                  <PrimaryButton
                    onClick={() => router.push(`/g/${guideSlug}/post/${createdPostId}`)}
                    fullWidth
                    size="lg"
                  >
                    View My Post
                  </PrimaryButton>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
