'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Upload, X, File, Image as ImageIcon, Video, FileText } from 'lucide-react';

interface FileUploadProps {
  onUpload: (file: File) => Promise<{ url: string }>;
  onRemove?: () => void;
  value?: string;
  accept?: string;
  maxSize?: number; // in bytes
  label?: string;
  disabled?: boolean;
}

export function FileUpload({
  onUpload,
  onRemove,
  value,
  accept = 'image/*,video/*,.pdf,.doc,.docx',
  maxSize = 10 * 1024 * 1024, // 10MB default
  label = 'Upload file',
  disabled = false,
}: FileUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size
    if (file.size > maxSize) {
      setError(`File size exceeds ${maxSize / 1024 / 1024}MB limit`);
      return;
    }

    // Validate file type
    if (accept && !accept.split(',').some(type => file.type.match(type.replace('*', '.*')))) {
      setError('Invalid file type');
      return;
    }

    setError(null);
    setUploading(true);
    setProgress(0);

    try {
      // Simulate progress for demo (in real implementation, use upload progress from API)
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      const result = await onUpload(file);
      
      clearInterval(progressInterval);
      setProgress(100);
      
      // Reset after successful upload
      setTimeout(() => {
        setProgress(0);
        setUploading(false);
      }, 500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
      setUploading(false);
      setProgress(0);
    }
  };

  const handleRemove = () => {
    if (onRemove) {
      onRemove();
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getFileIcon = (url: string) => {
    const extension = url.split('.').pop()?.toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension || '')) {
      return <ImageIcon className="h-5 w-5" />;
    }
    if (['mp4', 'webm', 'mov'].includes(extension || '')) {
      return <Video className="h-5 w-5" />;
    }
    if (['pdf', 'doc', 'docx'].includes(extension || '')) {
      return <FileText className="h-5 w-5" />;
    }
    return <File className="h-5 w-5" />;
  };

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      
      {value ? (
        <div className="flex items-center gap-3 p-3 border rounded-lg">
          <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
            {getFileIcon(value)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{value.split('/').pop()}</p>
            <p className="text-xs text-muted-foreground truncate">{value}</p>
          </div>
          {!disabled && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={handleRemove}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          <Input
            ref={fileInputRef}
            type="file"
            accept={accept}
            onChange={handleFileSelect}
            disabled={disabled || uploading}
            className="hidden"
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled || uploading}
            className="w-full"
          >
            <Upload className="h-4 w-4 mr-2" />
            {uploading ? 'Uploading...' : label}
          </Button>
          
          {uploading && (
            <Progress value={progress} className="h-2" />
          )}
          
          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}
        </div>
      )}
    </div>
  );
}

interface ImageUploadProps {
  onUpload: (file: File) => Promise<{ url: string }>;
  onRemove?: () => void;
  value?: string;
  label?: string;
  disabled?: boolean;
  aspectRatio?: 'square' | 'video' | 'banner';
}

export function ImageUpload({
  onUpload,
  onRemove,
  value,
  label = 'Upload image',
  disabled = false,
  aspectRatio = 'square',
}: ImageUploadProps) {
  const aspectClasses = {
    square: 'aspect-square',
    video: 'aspect-video',
    banner: 'aspect-[21/9]',
  };

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      
      {value ? (
        <div className="relative group">
          <div className={`relative overflow-hidden rounded-lg border ${aspectClasses[aspectRatio]}`}>
            <img
              src={value}
              alt="Preview"
              className="w-full h-full object-cover"
            />
            {!disabled && (
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={onRemove}
                >
                  <X className="h-4 w-4 mr-2" />
                  Remove
                </Button>
              </div>
            )}
          </div>
        </div>
      ) : (
        <FileUpload
          onUpload={onUpload}
          onRemove={onRemove}
          accept="image/*"
          label={label}
          disabled={disabled}
        />
      )}
    </div>
  );
}
