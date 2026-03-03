'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { PrimaryButton, SecondaryButton } from '@/components/ui/Button';
import { ImageUploader } from '@/components/ImageUploader';
import { ImageEditor } from '@/components/ImageEditor';
import { ShareModal } from '@/components/ShareModal';
import { toast } from '@/components/ui/Toast';
import { LOCATIONS } from '@/lib/constants';
import { createPost } from '@/app/actions/createPost';
import { generateStyledImage } from '@/app/actions/generateImage';
import { uploadGeneratedImage } from '@/app/actions/uploadGeneratedImage';
import { useGeolocation } from '@/hooks/useGeolocation';
import { findNearestLocation } from '@/lib/geolocation';
import { getTouristSessionId } from '@/lib/touristSession';
import { ArrowLeft, Send, Loader2, Share2, MapPin } from 'lucide-react';
import type { PostStyle, GeoCoordinates } from '@/lib/types';

interface ChatCreatePostProps {
  guideSlug: string;
}

type Step = 'welcome' | 'upload' | 'editor' | 'preview' | 'done';

export function ChatCreatePost({ guideSlug }: ChatCreatePostProps) {
  const router = useRouter();
  const [step, setStep] = useState<Step>('welcome');
  const [images, setImages] = useState<string[]>([]);
  const [location, setLocation] = useState('');
  const [locationAutoSet, setLocationAutoSet] = useState(false);
  const [experienceText, setExperienceText] = useState('');
  const [style, setStyle] = useState<PostStyle>('regular');
  const [biblicalVerse, setBiblicalVerse] = useState<string>('');
  const [verseReference, setVerseReference] = useState<string>('');
  const [generatingImage, setGeneratingImage] = useState(false);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [createdPostId, setCreatedPostId] = useState<string>('');
  const [showShareModal, setShowShareModal] = useState(false);

  const [exifCoords, setExifCoords] = useState<GeoCoordinates | null>(null);
  const { coords, nearestLocation } = useGeolocation({ autoRequest: true });

  // Auto-select location when GPS detected and user hasn't manually chosen
  useEffect(() => {
    if (nearestLocation && !location && !locationAutoSet) {
      setLocation(nearestLocation.location.name);
      setLocationAutoSet(true);
    }
  }, [nearestLocation, location, locationAutoSet]);

  // Handle EXIF GPS extracted from uploaded photo
  const handleExifGps = (gps: GeoCoordinates) => {
    setExifCoords(gps);
    // If no GPS location yet, use EXIF location
    if (!locationAutoSet && !location) {
      const nearest = findNearestLocation(gps);
      if (nearest) {
        setLocation(nearest.location.name);
        setLocationAutoSet(true);
      }
    }
  };

  // Draft persistence — save text fields to localStorage (not images — too large)
  const draftKey = `draft-${guideSlug}`;

  useEffect(() => {
    try {
      const saved = localStorage.getItem(draftKey);
      if (saved) {
        const draft = JSON.parse(saved);
        if (draft.location) setLocation(draft.location);
        if (draft.experienceText) setExperienceText(draft.experienceText);
      }
    } catch { /* ignore corrupt draft */ }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    try {
      if (step === 'done') {
        localStorage.removeItem(draftKey);
        return;
      }
      if (location || experienceText) {
        localStorage.setItem(draftKey, JSON.stringify({ location, experienceText }));
      }
    } catch { /* localStorage may be unavailable */ }
  }, [location, experienceText, step, draftKey]);

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
        touristSessionId: getTouristSessionId(),
        location,
        experienceText: experienceText.trim(),
        style,
        images: finalImages,
        biblicalVerse: biblicalVerse || undefined,
        verseReference: verseReference || undefined,
        coordinates: coords ? { lat: coords.lat, lng: coords.lng } : exifCoords ? { lat: exifCoords.lat, lng: exifCoords.lng } : undefined,
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
        {/* Back Button — step-aware */}
        <button
          onClick={() => {
            if (step === 'upload') setStep('welcome');
            else if (step === 'editor') setStep('upload');
            else if (step === 'preview') setStep('editor');
            else router.back();
          }}
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
                  Share a photo from today! Upload the moment that stood out to you.
                </p>
              </Card>
            </div>

            <div className="flex items-start gap-2">
              <div className="w-12 flex-shrink-0"></div>
              <div className="flex-1">
                <ImageUploader maxImages={1} onImagesChange={setImages} onExifGps={handleExifGps} existingImages={images} />
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
                <div className="relative">
                  <select
                    value={location}
                    onChange={(e) => {
                      setLocation(e.target.value);
                      setLocationAutoSet(false);
                    }}
                    className="w-full px-3 py-2 text-sm text-gray-900 bg-white border border-gray-200 rounded-lg focus:border-primary focus:outline-none"
                  >
                    <option value="">Where were you?</option>
                    {LOCATIONS.map((loc) => (
                      <option key={loc.id} value={loc.name}>
                        {loc.name}
                      </option>
                    ))}
                  </select>
                  {locationAutoSet && nearestLocation && location === nearestLocation.location.name && (
                    <span className="absolute right-8 top-1/2 -translate-y-1/2 text-xs text-secondary flex items-center gap-1">
                      <MapPin size={12} /> GPS
                    </span>
                  )}
                </div>

                <div className="relative">
                  <label htmlFor="experience-text" className="sr-only">Your experience</label>
                  <textarea
                    id="experience-text"
                    placeholder="What did this moment mean to you?"
                    value={experienceText}
                    onChange={(e) => setExperienceText(e.target.value)}
                    maxLength={500}
                    rows={3}
                    className="w-full px-3 py-2 text-sm text-gray-900 bg-white border border-gray-200 rounded-lg focus:border-primary focus:outline-none resize-none placeholder:text-gray-500"
                  />
                  <span className="absolute bottom-2 right-3 text-xs text-gray-500">
                    {experienceText.length}/500
                  </span>
                </div>

                {location && experienceText.trim().length > 0 && (
                  <PrimaryButton
                    onClick={() => setStep('editor')}
                    fullWidth
                    size="md"
                    className="gap-2"
                  >
                    <Send size={16} />
                    Continue
                  </PrimaryButton>
                )}
              </div>
            </div>
          </>
        )}

        {/* Step 3: Image Editor */}
        {step === 'editor' && (
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
                  Let&apos;s style your photo! Toggle the elements you want on your image, then tap &ldquo;Create Image&rdquo;.
                </p>
              </Card>
            </div>

            <div className="flex items-start gap-2">
              <div className="w-12 flex-shrink-0"></div>
              <div className="flex-1">
                <ImageEditor
                  imageUrl={images[0]}
                  location={location}
                  subLocation={nearestLocation?.poi?.name}
                  experienceText={experienceText}
                  isGenerating={generatingImage}
                  onGenerate={async (config) => {
                    const effectiveStyle: PostStyle = config.overlays.verse ? 'holy_land' : 'regular';
                    setStyle(effectiveStyle);

                    if (config.biblicalVerse) {
                      setBiblicalVerse(config.biblicalVerse);
                      setVerseReference(config.verseReference || '');
                    }

                    setGeneratingImage(true);

                    try {
                      const imageResult = await generateStyledImage({
                        location,
                        experience: experienceText,
                        style: effectiveStyle,
                        biblicalVerse: config.overlays.verse ? config.biblicalVerse : undefined,
                        sourceImageUrl: images[0],
                        overlays: config.overlays,
                      });

                      if (imageResult.success && imageResult.imageData) {
                        const timestamp = Date.now();
                        const uploadResult = await uploadGeneratedImage(
                          imageResult.imageData,
                          imageResult.mimeType || 'image/png',
                          `${guideSlug}-${location}-styled-${timestamp}`
                        );

                        if (uploadResult.success && uploadResult.path) {
                          setGeneratedImageUrl(uploadResult.path);
                          toast.success('Beautiful image created!');
                          setStep('preview');
                        } else {
                          toast.error('Failed to upload generated image');
                        }
                      } else {
                        toast.error(imageResult.error || 'Failed to generate styled image');
                      }
                    } catch (error) {
                      toast.error('Image generation failed: ' + (error as Error).message);
                    } finally {
                      setGeneratingImage(false);
                    }
                  }}
                  onKeepOriginal={() => {
                    setStyle('regular');
                    handleSubmit();
                  }}
                />
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

            {/* Action Buttons */}
            {createdPostId && (
              <div className="flex items-start gap-2">
                <div className="w-12 flex-shrink-0"></div>
                <div className="flex-1 space-y-2">
                  <PrimaryButton
                    onClick={() => setShowShareModal(true)}
                    fullWidth
                    size="lg"
                    className="bg-gradient-to-r from-warm to-accent hover:from-warm/90 hover:to-accent/90"
                  >
                    <Share2 size={18} className="mr-2" />
                    Share My Post
                  </PrimaryButton>
                  <SecondaryButton
                    onClick={() => router.push(`/g/${guideSlug}/post/${createdPostId}`)}
                    fullWidth
                    size="md"
                    className="border-warm text-warm hover:bg-warm/10"
                  >
                    <Send size={18} className="mr-2" />
                    Submit for Publishing
                  </SecondaryButton>
                  <SecondaryButton
                    onClick={() => router.push(`/g/${guideSlug}`)}
                    fullWidth
                    size="md"
                  >
                    Back to Chat
                  </SecondaryButton>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Share Modal */}
      <ShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        caption={experienceText}
        hashtags={['#VisitIsrael', '#HolyLand']}
        postUrl={createdPostId ? `${typeof window !== 'undefined' ? window.location.origin : ''}/g/${guideSlug}/post/${createdPostId}` : undefined}
        imageUrl={generatedImageUrl || images[0]}
      />
    </div>
  );
}
