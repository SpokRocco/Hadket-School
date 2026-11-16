import { useState, useRef, useEffect, useCallback } from 'react';
import {
  Upload,
  X,
  Loader2,
  CheckCircle2,
  Sparkles,
  Crop,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { compressImage, compressionPresets } from '@/utils/imageUtils';
import { prepareImageFileForCrop } from '@/utils/imageCropUtils';
import { ImageCropModal } from './ImageCropModal';

export interface ImageUploadCropOptions {
  enabled: boolean;
  aspect?: number;
  shape?: 'round' | 'rect';
  title?: string;
  description?: string;
  outputWidth?: number;
  outputHeight?: number;
}

interface ImageUploadProps {
  onUploadComplete: (url: string) => void;
  currentImage?: string;
  bucket?: string;
  folder?: string;
  maxSizeMB?: number;
  compressionPreset?: keyof typeof compressionPresets;
  cropOptions?: ImageUploadCropOptions;
}

const isValidImageFile = (file: File): boolean => {
  const ext = file.name.split('.').pop()?.toLowerCase();
  return (
    file.type.startsWith('image/') ||
    ['heic', 'heif', 'jpg', 'jpeg', 'png', 'webp', 'gif', 'svg'].includes(ext || '')
  );
};

export const ImageUpload = ({
  onUploadComplete,
  currentImage,
  bucket = 'images',
  folder = 'uploads',
  maxSizeMB = 0, // 0 = unlimited size
  compressionPreset = 'cover',
  cropOptions,
}: ImageUploadProps) => {
  const [preview, setPreview] = useState<string | null>(currentImage || null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // Interactive Cropper Modal states (used when cropOptions?.enabled is true)
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [cropSourceUrl, setCropSourceUrl] = useState<string | null>(null);
  const cropRevokeUrlRef = useRef<string | null>(null);
  const cropSourceMetaRef = useRef<{ name: string; origSize: number } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Sync preview with external currentImage changes
  useEffect(() => {
    setPreview(currentImage || null);
  }, [currentImage]);

  const cleanupCropObjectUrl = useCallback(() => {
    if (cropRevokeUrlRef.current) {
      URL.revokeObjectURL(cropRevokeUrlRef.current);
      cropRevokeUrlRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      cleanupCropObjectUrl();
    };
  }, [cleanupCropObjectUrl]);

  const uploadProcessedBlob = async (
    processedBlob: Blob,
    sourceFileName: string,
    origFileSize: number = 0,
    successTitle: string = 'อัปโหลดสำเร็จ'
  ) => {
    const isWebP = processedBlob.type === 'image/webp';
    const isPng = processedBlob.type === 'image/png';
    const isSvg = processedBlob.type === 'image/svg+xml';
    const fileExt = isSvg ? 'svg' : isPng ? 'png' : isWebP ? 'webp' : 'jpg';
    const contentType = isSvg
      ? 'image/svg+xml'
      : isPng
        ? 'image/png'
        : isWebP
          ? 'image/webp'
          : 'image/jpeg';
    const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

    let finalUrl = '';

    // 1. Try Supabase Storage upload
    try {
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(fileName, processedBlob, {
          cacheControl: '3600',
          upsert: true,
          contentType,
        });

      if (error) {
        console.warn('Supabase storage upload note:', error);
      } else if (data?.path) {
        const { data: publicData } = supabase.storage
          .from(bucket)
          .getPublicUrl(data.path);
        finalUrl = publicData?.publicUrl || '';
      }
    } catch (storageErr) {
      console.warn('Storage upload caught, switching to data URL fallback:', storageErr);
    }

    // 2. Fallback to persistent Data URL if storage was not configured or returned a temporary blob: URL
    if (!finalUrl || finalUrl.startsWith('blob:')) {
      finalUrl = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = () => resolve('');
        reader.readAsDataURL(processedBlob);
      });
    }

    if (!finalUrl) {
      throw new Error('ไม่สามารถแปลงข้อมูลรูปภาพได้');
    }

    setPreview(finalUrl);
    onUploadComplete(finalUrl);

    const origSizeMB = (origFileSize / (1024 * 1024)).toFixed(1);
    const compSizeKB = Math.round(processedBlob.size / 1024);
    const sizeInfo =
      origFileSize > 1.5 * 1024 * 1024
        ? ` (ปรับขนาดจาก ${origSizeMB} MB เหลือ ${compSizeKB} KB)`
        : '';

    toast({
      title: successTitle,
      description: `ประมวลผลรูปภาพเรียบร้อย${sizeInfo}${sourceFileName ? ` (${sourceFileName})` : ''}`,
    });
  };

  const processFile = async (file: File) => {
    if (!file) return;

    if (!isValidImageFile(file)) {
      toast({
        title: 'ประเภทไฟล์ไม่ถูกต้อง',
        description: 'กรุณาเลือกไฟล์รูปภาพเท่านั้น (JPG, PNG, WebP, HEIC, ฯลฯ)',
        variant: 'destructive',
      });
      return;
    }

    // Interactive Crop Flow: open preview & crop modal BEFORE saving/uploading
    if (cropOptions?.enabled) {
      setIsUploading(true);
      try {
        const { objectUrl } = await prepareImageFileForCrop(file);
        cleanupCropObjectUrl();
        cropRevokeUrlRef.current = objectUrl;
        cropSourceMetaRef.current = { name: file.name, origSize: file.size };
        setCropSourceUrl(objectUrl);
        setCropModalOpen(true);
      } catch (error: any) {
        console.error('Prepare crop error:', error);
        toast({
          title: 'ไม่สามารถเปิดไฟล์รูปภาพได้',
          description: error?.message || 'กรุณาลองเลือกไฟล์รูปภาพอื่น',
          variant: 'destructive',
        });
      } finally {
        setIsUploading(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
      return;
    }

    // Standard direct upload flow (for non-crop usages)
    setIsUploading(true);
    try {
      const compressionOptions =
        compressionPresets[compressionPreset] || { maxWidth: 1920, maxHeight: 1080, quality: 0.85 };
      const compressedBlob = await compressImage(file, compressionOptions);
      await uploadProcessedBlob(compressedBlob, file.name, file.size);
    } catch (error: any) {
      console.error('Upload error:', error);
      toast({
        title: 'อัปโหลดล้มเหลว',
        description: error.message || 'เกิดข้อผิดพลาดในการประมวลผลรูปภาพ',
        variant: 'destructive',
      });
      setPreview(currentImage || null);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleOpenCropForExisting = () => {
    if (!preview || isUploading) return;
    cleanupCropObjectUrl();
    cropSourceMetaRef.current = { name: 'profile-cropped.webp', origSize: 0 };
    setCropSourceUrl(preview);
    setCropModalOpen(true);
  };

  const handleCropCancel = () => {
    setCropModalOpen(false);
    setCropSourceUrl(null);
    cleanupCropObjectUrl();
    cropSourceMetaRef.current = null;
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleCropConfirm = async (croppedBlob: Blob) => {
    const meta = cropSourceMetaRef.current;
    setIsUploading(true);
    try {
      await uploadProcessedBlob(
        croppedBlob,
        meta?.name || 'cropped-image.webp',
        meta?.origSize || 0,
        'บันทึกรูปภาพที่ปรับแต่งแล้วสำเร็จ'
      );
      setCropModalOpen(false);
      setCropSourceUrl(null);
      cleanupCropObjectUrl();
      cropSourceMetaRef.current = null;
    } catch (error: any) {
      console.error('Cropped upload error:', error);
      toast({
        title: 'บันทึกรูปภาพไม่สำเร็จ',
        description: error?.message || 'เกิดข้อผิดพลาดในการบันทึกรูปภาพที่ปรับแต่ง',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPreview(null);
    onUploadComplete('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const isRoundCropPreview = cropOptions?.enabled && cropOptions.shape !== 'rect';

  return (
    <div className="space-y-3">
      {/* Hidden File Input attached to ref */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,.heic,.heif,.webp,.png,.jpg,.jpeg,.svg,.gif"
        onChange={handleFileSelect}
        className="hidden"
        disabled={isUploading}
      />

      {preview ? (
        <div className="space-y-2">
          {/* Image Display */}
          {isRoundCropPreview ? (
            <div
              onClick={handleOpenCropForExisting}
              className="relative rounded-2xl overflow-hidden border-2 border-border hover:border-primary/60 transition-all bg-gradient-to-br from-primary to-navy-light group cursor-pointer shadow-sm py-6 px-4 flex flex-col items-center justify-center gap-2.5"
              title="คลิกเพื่อปรับแต่งตำแหน่งและขนาดรูปภาพ"
            >
              <div className="relative">
                <img
                  src={preview}
                  alt="Preview"
                  referrerPolicy="no-referrer"
                  className="w-28 h-28 rounded-full object-cover border-4 border-white/85 shadow-lg transition-transform duration-300 group-hover:scale-[1.03]"
                />
                <span className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-accent text-accent-foreground flex items-center justify-center shadow-md border-2 border-white">
                  <Crop className="w-4 h-4" />
                </span>
              </div>

              <div className="flex items-center gap-2 text-white/95 text-xs">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
                <span className="font-medium">ตัวอย่างรูปโปรไฟล์จริง (คลิกเพื่อปรับตำแหน่ง)</span>
              </div>

              {isUploading && (
                <div className="absolute inset-0 bg-black/70 backdrop-blur-xs flex flex-col items-center justify-center gap-2 text-white z-20">
                  <Loader2 className="h-9 w-9 text-accent animate-spin" />
                  <p className="text-sm font-semibold">กำลังประมวลผลรูปภาพ...</p>
                </div>
              )}
            </div>
          ) : (
            <div
              onClick={() =>
                cropOptions?.enabled ? handleOpenCropForExisting() : fileInputRef.current?.click()
              }
              className="relative rounded-2xl overflow-hidden border-2 border-border hover:border-primary/60 transition-all bg-slate-950/20 group cursor-pointer shadow-sm"
              title={
                cropOptions?.enabled
                  ? 'คลิกเพื่อปรับแต่งตำแหน่งรูปภาพ'
                  : 'คลิกเพื่อเลือกไฟล์รูปใหม่จากเครื่อง'
              }
            >
              <img
                src={preview}
                alt="Preview"
                referrerPolicy="no-referrer"
                className="w-full h-56 object-cover transition-transform duration-300 group-hover:scale-[1.01]"
              />

              {/* Uploading Spinner Overlay */}
              {isUploading && (
                <div className="absolute inset-0 bg-black/70 backdrop-blur-xs flex flex-col items-center justify-center gap-2 text-white z-20">
                  <Loader2 className="h-9 w-9 text-primary animate-spin" />
                  <p className="text-sm font-semibold">กำลังประมวลผลรูปภาพความละเอียดสูง...</p>
                  <p className="text-xs text-white/70">รองรับ Sony A7 / Lightroom / กล้อง Mirrorless ทุกรุ่น</p>
                </div>
              )}

              {/* Click to change hint banner */}
              <div className="absolute inset-x-0 bottom-0 py-1.5 px-3 bg-gradient-to-t from-black/80 to-transparent flex items-center justify-between text-white/90 text-xs">
                <span className="flex items-center gap-1 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  รูปภาพที่เลือกอยู่ขณะนี้
                </span>
                <span className="text-[11px] text-white/75 group-hover:text-white transition-colors">
                  {cropOptions?.enabled ? 'คลิกเพื่อปรับตำแหน่ง' : 'คลิกเพื่อเปลี่ยนรูป'}
                </span>
              </div>
            </div>
          )}

          {/* Action Bar (Always visible!) */}
          <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-xl bg-secondary/50 border border-border">
            <div className="flex flex-wrap items-center gap-2">
              {cropOptions?.enabled && (
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={handleOpenCropForExisting}
                  disabled={isUploading}
                  className="gap-1.5 text-xs bg-accent/15 hover:bg-accent/25 text-foreground border border-accent/40 shadow-xs"
                >
                  <Crop className="w-3.5 h-3.5 text-accent" />
                  ปรับแต่งตำแหน่งรูปภาพ
                </Button>
              )}

              <Button
                type="button"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="gap-1.5 text-xs bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm"
              >
                <Upload className="w-3.5 h-3.5" />
                เลือกรูปภาพใหม่จากเครื่อง
              </Button>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleRemove}
                disabled={isUploading}
                className="gap-1.5 text-xs text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/30"
              >
                <X className="w-3.5 h-3.5" />
                ลบรูปนี้
              </Button>
            </div>

            <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" />
              พร้อมบันทึก
            </span>
          </div>
        </div>
      ) : (
        /* Empty Dropzone with explicit upload button and drag & drop */
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`relative w-full min-h-[200px] border-2 border-dashed rounded-2xl flex flex-col items-center justify-center p-6 text-center transition-all cursor-pointer ${
            isDragging
              ? 'border-primary bg-primary/10 scale-[1.01]'
              : 'border-border hover:border-primary/80 bg-secondary/30 hover:bg-secondary/50'
          }`}
        >
          {isUploading ? (
            <div className="flex flex-col items-center gap-2 pointer-events-none">
              <Loader2 className="h-10 w-10 text-primary animate-spin" />
              <p className="text-sm font-semibold text-foreground">กำลังประมวลผลรูปภาพความละเอียดสูง...</p>
              <p className="text-xs text-muted-foreground">รองรับ Sony A7 / Lightroom / กล้อง Mirrorless ทุกรุ่น ไม่จำกัดขนาดไฟล์</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3 pointer-events-none">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shadow-xs">
                <Upload className="h-7 w-7" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-bold text-foreground">
                  คลิกเพื่อเลือกไฟล์ หรือลากรูปภาพมาวางที่นี่
                </p>
                <p className="text-xs text-muted-foreground max-w-sm">
                  รองรับทุกนามสกุลไฟล์ (JPG, PNG, WebP, GIF, HEIC/iPhone/iPad) ไม่จำกัดขนาดของรูปภาพ
                </p>
              </div>

              <div className="pt-1">
                <span className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground font-semibold text-xs shadow-md">
                  <Upload className="w-4 h-4" />
                  เลือกรูปภาพจากเครื่องคอมพิวเตอร์ / มือถือ
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {cropOptions?.enabled && (
        <ImageCropModal
          open={cropModalOpen}
          imageSrc={cropSourceUrl}
          aspect={cropOptions.aspect ?? 1}
          cropShape={cropOptions.shape ?? 'round'}
          title={cropOptions.title ?? 'ปรับแต่งและครอปรูปภาพ'}
          description={cropOptions.description}
          outputWidth={cropOptions.outputWidth ?? 800}
          outputHeight={cropOptions.outputHeight}
          onCancel={handleCropCancel}
          onConfirm={handleCropConfirm}
        />
      )}
    </div>
  );
};
