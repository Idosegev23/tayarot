'use client';

import { X, Copy, Facebook, Instagram, MessageCircle, Share2 } from 'lucide-react';
import { Button } from './ui/Button';
import { toast } from './ui/Toast';
import { cn } from '@/lib/utils';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  caption: string;
  hashtags: readonly string[] | string[];
  postUrl?: string; // Full URL to the post
  imageUrl?: string; // Image URL for sharing
}

export function ShareModal({ isOpen, onClose, caption, hashtags, postUrl, imageUrl }: ShareModalProps) {
  if (!isOpen) return null;

  const fullText = `${caption}\n\n${hashtags.join(' ')}`;
  const shareUrl = postUrl || (typeof window !== 'undefined' ? window.location.href : '');
  const encodedUrl = encodeURIComponent(shareUrl);
  const encodedText = encodeURIComponent(fullText);
  const encodedCaption = encodeURIComponent(caption);

  const handleCopy = () => {
    const textWithUrl = postUrl ? `${fullText}\n\n${postUrl}` : fullText;
    navigator.clipboard.writeText(textWithUrl);
    toast.success('Caption and link copied to clipboard!');
  };

  const handleShareFacebook = () => {
    // Facebook Share Dialog - works for both personal and pages
    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedText}`;
    window.open(facebookUrl, '_blank', 'width=600,height=400');
    toast.success('Opening Facebook share...');
  };

  const handleShareWhatsApp = () => {
    // WhatsApp Share
    const whatsappUrl = `https://wa.me/?text=${encodedText}%0A%0A${encodedUrl}`;
    window.open(whatsappUrl, '_blank');
    toast.success('Opening WhatsApp...');
  };

  const handleShareTwitter = () => {
    // Twitter/X Share
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`;
    window.open(twitterUrl, '_blank', 'width=600,height=400');
    toast.success('Opening Twitter...');
  };

  const handleShareInstagram = () => {
    // Instagram doesn't support direct sharing from web
    // Copy to clipboard and show instructions
    navigator.clipboard.writeText(fullText);
    toast.success('Caption copied! Open Instagram app to share the image with this caption.');
  };

  const handleNativeShare = async () => {
    // Native Web Share API for mobile
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'My Holy Land Journey',
          text: caption,
          url: shareUrl,
        });
        toast.success('Shared successfully!');
      } catch (error) {
        // User cancelled or error occurred
        console.log('Share cancelled or failed:', error);
      }
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Share your experience"
    >
      <div
        className={cn(
          'bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto',
          'animate-in fade-in slide-in-from-bottom-4 duration-200'
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">Share Your Experience</h2>
          <button
            onClick={onClose}
            className="flex items-center justify-center w-11 h-11 text-gray-500 hover:text-gray-700 transition-colors rounded-full hover:bg-gray-100"
            aria-label="Close share dialog"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Caption Preview */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Caption
            </label>
            <div className="bg-gray-50 rounded-xl p-4 text-gray-700 whitespace-pre-wrap text-sm">
              {fullText}
            </div>
          </div>

          {/* Copy Button */}
          <Button
            variant="outline"
            fullWidth
            onClick={handleCopy}
            className="gap-2"
          >
            <Copy size={20} />
            Copy Caption
          </Button>

          {/* Share Buttons */}
          <div>
            <p className="text-sm font-medium text-gray-700 mb-3">
              Share on Social Media
            </p>
            <div className="space-y-2">
              {/* Native Share (Mobile) */}
              {typeof window !== 'undefined' && 'share' in navigator && (
                <Button
                  fullWidth
                  onClick={handleNativeShare}
                  className="gap-2 bg-primary hover:bg-primary/90"
                >
                  <Share2 size={20} />
                  Share
                </Button>
              )}
              
              {/* Facebook */}
              <Button
                fullWidth
                onClick={handleShareFacebook}
                className="gap-2 bg-[#1877f2] hover:bg-[#1877f2]/90"
              >
                <Facebook size={20} />
                Share on Facebook
              </Button>
              
              {/* WhatsApp */}
              <Button
                fullWidth
                onClick={handleShareWhatsApp}
                className="gap-2 bg-[#25D366] hover:bg-[#25D366]/90"
              >
                <MessageCircle size={20} />
                Share on WhatsApp
              </Button>
              
              {/* Twitter/X */}
              <Button
                fullWidth
                onClick={handleShareTwitter}
                className="gap-2 bg-[#1DA1F2] hover:bg-[#1DA1F2]/90"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
                Share on X (Twitter)
              </Button>
              
              {/* Instagram */}
              <Button
                fullWidth
                onClick={handleShareInstagram}
                className="gap-2 bg-gradient-to-r from-[#833AB4] via-[#FD1D1D] to-[#F77737] hover:opacity-90 text-white"
              >
                <Instagram size={20} />
                Copy for Instagram
              </Button>
            </div>
          </div>

          {/* Helpful Note */}
          <p className="text-xs text-gray-500 text-center">
            Click any platform to share your Holy Land journey 🙏
          </p>
        </div>
      </div>
    </div>
  );
}
