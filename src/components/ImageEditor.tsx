'use client';

import { useState, useRef, type ReactNode } from 'react';
import { MapPin, BookOpen, Type, Calendar, Loader2, Wand2 } from 'lucide-react';
import { PrimaryButton, SecondaryButton } from '@/components/ui/Button';
import { toast } from '@/components/ui/Toast';
import { cn } from '@/lib/utils';
import { suggestBiblicalVerse } from '@/app/actions/generateImage';
import type { OverlayConfig } from '@/lib/types';

interface ImageEditorProps {
  imageUrl: string;
  location: string;
  subLocation?: string;
  experienceText: string;
  onGenerate: (config: {
    overlays: OverlayConfig;
    biblicalVerse?: string;
    verseReference?: string;
  }) => void;
  onKeepOriginal: () => void;
  isGenerating: boolean;
}

interface OverlayToggleProps {
  icon: ReactNode;
  label: string;
  active: boolean;
  onToggle: () => void;
  loading?: boolean;
}

function OverlayToggle({ icon, label, active, onToggle, loading }: OverlayToggleProps) {
  return (
    <button
      onClick={onToggle}
      disabled={loading}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-xs font-medium',
        'transition-all duration-200 border',
        active
          ? 'bg-primary/10 text-primary border-primary/30'
          : 'bg-gray-100 text-gray-400 border-gray-200',
        loading && 'opacity-50 cursor-not-allowed'
      )}
    >
      {loading ? <Loader2 size={14} className="animate-spin" /> : icon}
      {label}
    </button>
  );
}

export function ImageEditor({
  imageUrl,
  location,
  subLocation,
  experienceText,
  onGenerate,
  onKeepOriginal,
  isGenerating,
}: ImageEditorProps) {
  const [overlays, setOverlays] = useState<OverlayConfig>({
    locationTag: true,
    verse: false,
    experienceText: true,
    dateStamp: false,
  });

  const [biblicalVerse, setBiblicalVerse] = useState('');
  const [verseReference, setVerseReference] = useState('');
  const [loadingVerse, setLoadingVerse] = useState(false);
  const verseFetchedRef = useRef(false);

  const hasAnyOverlay = overlays.locationTag || overlays.verse || overlays.experienceText || overlays.dateStamp;

  const toggleOverlay = async (key: keyof OverlayConfig) => {
    const newValue = !overlays[key];
    setOverlays(prev => ({ ...prev, [key]: newValue }));

    // Lazy-load verse on first toggle
    if (key === 'verse' && newValue && !verseFetchedRef.current) {
      setLoadingVerse(true);
      try {
        const result = await suggestBiblicalVerse(location, experienceText);
        if (result.success && result.verse) {
          setBiblicalVerse(result.verse);
          setVerseReference(result.reference || '');
          verseFetchedRef.current = true;
        } else {
          setOverlays(prev => ({ ...prev, verse: false }));
          toast.error('Could not find a verse. Try again.');
        }
      } catch {
        verseFetchedRef.current = false;
        setOverlays(prev => ({ ...prev, verse: false }));
        toast.error('Failed to load verse. Tap Verse to try again.');
      } finally {
        setLoadingVerse(false);
      }
    }
  };

  const handleGenerate = () => {
    onGenerate({
      overlays,
      biblicalVerse: overlays.verse ? biblicalVerse : undefined,
      verseReference: overlays.verse ? verseReference : undefined,
    });
  };

  const dateStr = new Date().toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="space-y-4">
      {/* Live Preview */}
      <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-gray-900 shadow-lg">
        {/* Base Image */}
        <img
          src={imageUrl}
          alt="Preview"
          className="absolute inset-0 w-full h-full object-cover"
        />

        {/* Location Tag — top-left */}
        {overlays.locationTag && (
          <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5 bg-black/60 backdrop-blur-sm rounded-full px-3 py-1.5 transition-all duration-300">
            <MapPin size={13} className="text-white" />
            <span className="text-white text-xs font-medium">{location}</span>
            {subLocation && (
              <>
                <span className="text-white/40">|</span>
                <span className="text-white/70 text-xs">{subLocation}</span>
              </>
            )}
          </div>
        )}

        {/* Date Stamp — top-right */}
        {overlays.dateStamp && (
          <div className="absolute top-3 right-3 z-10 bg-black/50 backdrop-blur-sm rounded-md px-2 py-1 transition-all duration-300">
            <span className="text-white/90 text-[10px] font-mono tracking-wide">
              {dateStr}
            </span>
          </div>
        )}

        {/* Experience Text — center */}
        {overlays.experienceText && (
          <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 z-10 px-6 transition-all duration-300">
            <div className="bg-gradient-to-b from-transparent via-black/40 to-transparent py-6">
              <p className="text-white text-center text-sm font-medium leading-relaxed drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] line-clamp-3">
                {experienceText}
              </p>
            </div>
          </div>
        )}

        {/* Biblical Verse — bottom */}
        {overlays.verse && biblicalVerse && !loadingVerse && (
          <div className="absolute bottom-0 inset-x-0 z-10 px-4 pb-4 pt-8 bg-gradient-to-t from-black/70 via-black/30 to-transparent transition-all duration-300">
            <p className="text-[#EBB877] text-center text-xs italic leading-relaxed drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]">
              &ldquo;{biblicalVerse}&rdquo;
            </p>
            {verseReference && (
              <p className="text-[#EBB877]/70 text-center text-[10px] mt-1">
                &mdash; {verseReference}
              </p>
            )}
          </div>
        )}

        {/* Loading verse indicator */}
        {overlays.verse && loadingVerse && (
          <div className="absolute bottom-0 inset-x-0 z-10 px-4 pb-4 pt-8 bg-gradient-to-t from-black/70 to-transparent">
            <div className="flex items-center justify-center gap-2">
              <Loader2 size={14} className="text-[#EBB877] animate-spin" />
              <span className="text-[#EBB877] text-xs">Finding a verse...</span>
            </div>
          </div>
        )}
      </div>

      {/* Toggle Controls */}
      <div className="flex flex-wrap gap-2">
        <OverlayToggle
          icon={<MapPin size={14} />}
          label="Location"
          active={overlays.locationTag}
          onToggle={() => toggleOverlay('locationTag')}
        />
        <OverlayToggle
          icon={<BookOpen size={14} />}
          label="Verse"
          active={overlays.verse}
          onToggle={() => toggleOverlay('verse')}
          loading={loadingVerse}
        />
        <OverlayToggle
          icon={<Type size={14} />}
          label="Text"
          active={overlays.experienceText}
          onToggle={() => toggleOverlay('experienceText')}
        />
        <OverlayToggle
          icon={<Calendar size={14} />}
          label="Date"
          active={overlays.dateStamp}
          onToggle={() => toggleOverlay('dateStamp')}
        />
      </div>

      {/* Action Buttons */}
      <div className="space-y-2">
        <PrimaryButton
          onClick={handleGenerate}
          disabled={isGenerating || loadingVerse || !hasAnyOverlay}
          fullWidth
          size="md"
          className="bg-gradient-to-r from-warm to-accent hover:from-warm/90 hover:to-accent/90"
        >
          {isGenerating ? (
            <>
              <Loader2 size={16} className="mr-2 animate-spin" />
              Creating Image...
            </>
          ) : (
            <>
              <Wand2 size={16} className="mr-2" />
              Create Image
            </>
          )}
        </PrimaryButton>
        <SecondaryButton
          onClick={onKeepOriginal}
          disabled={isGenerating}
          fullWidth
          size="md"
        >
          Keep Original Photo
        </SecondaryButton>
      </div>
    </div>
  );
}
