'use client';

import { useState, useRef, ChangeEvent, DragEvent } from 'react';
import Image from 'next/image';
import { Upload, X, Loader2, Camera } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from './ui/Toast';
import imageCompression from 'browser-image-compression';
import { extractExifGps } from '@/lib/geolocation';
import type { GeoCoordinates } from '@/lib/types';

interface ImageUploaderProps {
  maxImages?: number;
  onImagesChange: (urls: string[]) => void;
  onExifGps?: (coords: GeoCoordinates) => void;
  existingImages?: string[];
}

export function ImageUploader({
  maxImages = 5,
  onImagesChange,
  onExifGps,
  existingImages = [],
}: ImageUploaderProps) {
  const [images, setImages] = useState<string[]>(existingImages);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const remaining = maxImages - images.length;
    if (remaining <= 0) {
      toast.error(`Maximum ${maxImages} images allowed`);
      return;
    }

    const filesToUpload = Array.from(files).slice(0, remaining);
    
    // Validate file types
    const validFiles = filesToUpload.filter((file) => {
      if (!file.type.startsWith('image/')) {
        toast.error(`${file.name} is not an image`);
        return false;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name} is too large (max 5MB)`);
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) return;

    setUploading(true);

    try {
      // Extract EXIF GPS from the first image before compression strips it
      if (onExifGps) {
        for (const file of validFiles) {
          try {
            const arrayBuffer = await file.arrayBuffer();
            const gps = extractExifGps(arrayBuffer);
            if (gps) {
              onExifGps(gps);
              break; // Only need GPS from one image
            }
          } catch {
            // EXIF extraction is best-effort
          }
        }
      }

      // Compress and convert to data URLs
      const compressOptions = {
        maxSizeMB: 2, // Compress to max 2MB
        maxWidthOrHeight: 2000, // Max dimension 2000px
        useWebWorker: true,
        fileType: 'image/jpeg', // Convert to JPEG for better compression
      };

      const urls = await Promise.all(
        validFiles.map(async (file) => {
          try {
            // Compress the image
            const compressedFile = await imageCompression(file, compressOptions);
            
            // Convert to base64
            return new Promise<string>((resolve, reject) => {
              const reader = new FileReader();
              reader.onload = () => resolve(reader.result as string);
              reader.onerror = reject;
              reader.readAsDataURL(compressedFile);
            });
          } catch (error) {
            console.error('Compression error:', error);
            // Fallback to original file if compression fails
            return new Promise<string>((resolve, reject) => {
              const reader = new FileReader();
              reader.onload = () => resolve(reader.result as string);
              reader.onerror = reject;
              reader.readAsDataURL(file);
            });
          }
        })
      );

      const newImages = [...images, ...urls];
      setImages(newImages);
      onImagesChange(newImages);
      toast.success(`${validFiles.length} image(s) added and optimized`);
    } catch (error) {
      console.error('Error processing images:', error);
      toast.error('Failed to process images');
    } finally {
      setUploading(false);
    }
  };

  const handleDrag = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    handleFiles(e.dataTransfer.files);
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files);
  };

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    setImages(newImages);
    onImagesChange(newImages);
    toast.success('Image removed');
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      {images.length < maxImages && (
        <div className="space-y-2">
          <div
            className={cn(
              'relative border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-200',
              dragActive
                ? 'border-primary bg-primary/5 scale-[1.02]'
                : 'border-gray-300 hover:border-primary hover:bg-primary/5',
              uploading && 'opacity-50 pointer-events-none'
            )}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={openFileDialog}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleChange}
              className="hidden"
            />
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleChange}
              className="hidden"
            />

            {uploading ? (
              <div className="flex flex-col items-center">
                <Loader2 className="w-12 h-12 text-primary animate-spin" />
                <p className="mt-4 text-gray-600">Processing image...</p>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <Upload className="w-12 h-12 text-gray-400" />
                <p className="mt-4 text-gray-700 font-medium">
                  {maxImages === 1 ? 'Tap to upload your photo' : 'Drag & drop or click to upload'}
                </p>
                <p className="mt-1 text-sm text-gray-500">
                  {maxImages === 1 ? 'Max 5MB' : `Up to ${maxImages} images, max 5MB each`}
                </p>
              </div>
            )}
          </div>

          {/* Camera button — visible on mobile */}
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); cameraInputRef.current?.click(); }}
            disabled={uploading}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-primary to-secondary text-white hover:shadow-lg hover:shadow-primary/25 transition-all text-sm font-medium sm:hidden"
          >
            <Camera size={18} />
            Take a Photo
          </button>
        </div>
      )}

      {/* Image Grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {images.map((url, index) => (
            <div
              key={index}
              className="relative aspect-square rounded-xl overflow-hidden bg-gray-100 group animate-bounce-in"
            >
              <Image
                src={url}
                alt={`Upload ${index + 1}`}
                fill
                className="object-cover"
              />
              <button
                onClick={() => removeImage(index)}
                className="absolute top-1 right-1 bg-red-500 text-white w-8 h-8 flex items-center justify-center rounded-full opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity hover:bg-red-600"
                aria-label="Remove image"
              >
                <X size={16} />
              </button>
              <div className="absolute bottom-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded-full">
                {index + 1}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
