import { useState, useRef, useEffect } from 'react';
import { Upload, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { compressImage, compressionPresets, type CompressOptions } from '@/utils/imageUtils';

interface ImageUploadProps {
    onUploadComplete: (url: string) => void;
    currentImage?: string;
    bucket?: string;
    folder?: string;
    maxSizeMB?: number;
    compressionPreset?: keyof typeof compressionPresets;
}

export const ImageUpload = ({
    onUploadComplete,
    currentImage,
    bucket = 'images',
    folder = 'uploads',
    maxSizeMB = 0, // 0 = unlimited size
    compressionPreset = 'profile',
}: ImageUploadProps) => {
    const [preview, setPreview] = useState<string | null>(currentImage || null);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { toast } = useToast();

    // Update preview when currentImage changes
    useEffect(() => {
        setPreview(currentImage || null);
    }, [currentImage]);

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Check if file is image (including iPhone formats)
        const ext = file.name.split('.').pop()?.toLowerCase();
        const isImage = file.type.startsWith('image/') || ['heic', 'heif', 'jpg', 'jpeg', 'png', 'webp', 'gif', 'svg'].includes(ext || '');

        if (!isImage) {
            toast({
                title: 'ประเภทไฟล์ไม่ถูกต้อง',
                description: 'กรุณาเลือกไฟล์รูปภาพเท่านั้น (JPG, PNG, WebP, HEIC, ฯลฯ)',
                variant: 'destructive',
            });
            return;
        }

        // Upload to Supabase Storage
    setIsUploading(true);
    try {
      // Compress image before upload
      const compressionOptions = compressionPresets[compressionPreset];
      const compressedBlob = await compressImage(file, compressionOptions);

      // Show compressed preview immediately
      const previewUrl = URL.createObjectURL(compressedBlob);
      setPreview(previewUrl);

      const fileExt = ext === 'heic' || ext === 'heif' ? 'webp' : (ext || 'webp');
      const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

      let finalUrl = '';
      try {
        const { data, error } = await supabase.storage
          .from(bucket)
          .upload(fileName, compressedBlob, {
            cacheControl: '3600',
            upsert: false,
            contentType: compressedBlob.type || 'image/webp',
          });

        if (error) throw error;

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from(bucket)
          .getPublicUrl(data.path);

        finalUrl = publicUrl;
      } catch (storageErr: any) {
        console.warn('Storage upload warning, fallback to data URL:', storageErr);
        // Fallback to data URL
        finalUrl = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(compressedBlob);
        });
      }

      setPreview(finalUrl);
      onUploadComplete(finalUrl);

      toast({
        title: 'อัปโหลดสำเร็จ',
        description: 'รูปภาพถูกประมวลผลและพร้อมใช้งานเรียบร้อยแล้ว',
      });
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

  const handleRemove = () => {
    setPreview(null);
    onUploadComplete('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-3">
      {preview ? (
        <div className="relative group rounded-xl overflow-hidden border-2 border-border bg-slate-950/20">
          <img
            src={preview}
            alt="Preview"
            referrerPolicy="no-referrer"
            className="w-full h-56 object-cover"
          />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <label className="relative cursor-pointer bg-primary text-primary-foreground hover:bg-primary/90 px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 shadow-md">
              <Upload className="w-3.5 h-3.5" />
              เปลี่ยนรูปภาพ
              <input
                type="file"
                accept="image/*,.heic,.heif,.webp,.png,.jpg,.jpeg,.svg,.gif"
                onChange={handleFileSelect}
                className="sr-only"
                disabled={isUploading}
              />
            </label>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              className="text-xs h-8 gap-1 shadow-md"
              onClick={handleRemove}
              disabled={isUploading}
            >
              <X className="h-3.5 w-3.5" />
              ลบรูปนี้
            </Button>
          </div>
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute top-2 right-2 sm:hidden h-8 w-8 rounded-full"
            onClick={handleRemove}
            disabled={isUploading}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div className="relative w-full h-52 border-2 border-dashed border-border hover:border-primary rounded-xl flex flex-col items-center justify-center transition-all bg-secondary/40 overflow-hidden group">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,.heic,.heif,.webp,.png,.jpg,.jpeg,.svg,.gif"
            onChange={handleFileSelect}
            disabled={isUploading}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            title="คลิกเพื่อเลือกไฟล์รูปภาพ"
          />
          {isUploading ? (
            <div className="flex flex-col items-center gap-2 pointer-events-none">
              <Loader2 className="h-10 w-10 text-primary animate-spin" />
              <p className="text-sm font-medium text-foreground">กำลังประมวลผลและอัปโหลดรูปภาพ...</p>
              <p className="text-xs text-muted-foreground">แปลงภาพอัตโนมัติ ไม่จำกัดขนาด</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 p-4 text-center pointer-events-none group-hover:scale-[1.02] transition-transform">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                <Upload className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">คลิกเพื่อเลือกหรือลากไฟล์รูปภาพมาวางที่นี่</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  รองรับทุกขนาดและทุกนามสกุลไฟล์ (JPG, PNG, WebP, GIF, HEIC/iPhone/iPad)
                </p>
              </div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium mt-1">
                <Upload className="w-3 h-3" />
                เลือกรูปภาพจากเครื่อง
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
