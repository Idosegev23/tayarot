'use client';

import { X, Copy, Facebook, Instagram } from 'lucide-react';
import { Button } from './ui/Button';
import { toast } from './ui/Toast';
import { cn } from '@/lib/utils';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  caption: string;
  hashtags: string[];
}

export function ShareModal({ isOpen, onClose, caption, hashtags }: ShareModalProps) {
  if (!isOpen) return null;

  const fullText = `${caption}\n\n${hashtags.join(' ')}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(fullText);
    toast.success('Caption copied to clipboard!');
  };

  const handleShare = (platform: string) => {
    toast.success(`Shared to ${platform}! (Demo)`);
    setTimeout(onClose, 1500);
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
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
            className="text-gray-400 hover:text-gray-600 transition-colors"
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
              <Button
                fullWidth
                onClick={() => handleShare('Facebook')}
                className="gap-2 bg-[#1877f2] hover:bg-[#1877f2]/90"
              >
                <Facebook size={20} />
                Share on Facebook
              </Button>
              <Button
                fullWidth
                onClick={() => handleShare('Instagram')}
                className="gap-2 bg-gradient-to-r from-[#833ab4] via-[#fd1d1d] to-[#fcb045] hover:opacity-90"
              >
                <Instagram size={20} />
                Share on Instagram
              </Button>
            </div>
          </div>

          {/* Demo Notice */}
          <p className="text-xs text-gray-500 text-center">
            Demo mode: Sharing is simulated
          </p>
        </div>
      </div>
    </div>
  );
}
