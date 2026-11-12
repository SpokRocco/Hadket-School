import { useState, useRef, useEffect } from 'react';
import { Upload, X, Loader2, CheckCircle2, Image as ImageIcon, Sparkles } from 'lucide-react';
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
  compressionPreset = 'cover',
}: ImageUploadProps) => {
  const [preview, setPreview] = useState<string | null>(currentImage || null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Update preview when currentImage changes
  useEffect(() => {
    setPreview(currentImage || null);
  }, [currentImage]);

  const processFile = async (file: File) => {
    if (!file) return;

    // Check if file is image (including iPhone/iPad formats)
    const ext = file.name.split('.').pop()?.toLowerCase();
    const isImage =
      file.type.startsWith('image/') ||
      ['heic', 'heif', 'jpg', 'jpeg', 'png', 'webp', 'gif', 'svg'].includes(ext || '');

    if (!isImage) {
      toast({
        title: 'ประเภทไฟล์ไม่ถูกต้อง',
        description: 'กรุณาเลือกไฟล์รูปภาพเท่านั้น (JPG, PNG, WebP, HEIC, ฯลฯ)',
        variant: 'destructive',
      });
      return;
    }

    setIsUploading(true);
    try {
      // 1. Compress image before upload with preset
      const compressionOptions =
        compressionPresets[compressionPreset] || { maxWidth: 1600, maxHeight: 1000, quality: 0.82 };
      const compressedBlob = await compressImage(file, compressionOptions);

      const fileExt = ext === 'heic' || ext === 'heif' ? 'webp' : ext || 'webp';
      const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

      let finalUrl = '';

      // 2. Try Supabase Storage upload
      try {
        const { data, error } = await supabase.storage
          .from(bucket)
          .upload(fileName, compressedBlob, {
            cacheControl: '3600',
            upsert: true,
            contentType: compressedBlob.type || 'image/webp',
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

      // 3. Fallback to persistent Data URL if storage was not configured or returned a temporary blob: URL
      if (!finalUrl || finalUrl.startsWith('blob:')) {
        finalUrl = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = () => resolve('');
          reader.readAsDataURL(compressedBlob);
        });
      }

      if (finalUrl) {
        setPreview(finalUrl);
        onUploadComplete(finalUrl);

        toast({
          title: 'อัปโหลดสำเร็จ',
          description: `ประมวลผลรูปภาพเรียบร้อย (${file.name})`,
        });
      } else {
        throw new Error('ไม่สามารถแปลงข้อมูลรูปภาพได้');
      }
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
          <div
            onClick={() => fileInputRef.current?.click()}
            className="relative rounded-2xl overflow-hidden border-2 border-border hover:border-primary/60 transition-all bg-slate-950/20 group cursor-pointer shadow-sm"
            title="คลิกเพื่อเลือกไฟล์รูปใหม่จากเครื่อง"
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
                <p className="text-sm font-semibold">กำลังประมวลผลและอัปโหลดรูปภาพ...</p>
                <p className="text-xs text-white/70">แปลงความละเอียดอัตโนมัติ</p>
              </div>
            )}

            {/* Click to change hint banner */}
            <div className="absolute inset-x-0 bottom-0 py-1.5 px-3 bg-gradient-to-t from-black/80 to-transparent flex items-center justify-between text-white/90 text-xs">
              <span className="flex items-center gap-1 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                รูปภาพที่เลือกอยู่ขณะนี้
              </span>
              <span className="text-[11px] text-white/75 group-hover:text-white transition-colors">
                คลิกเพื่อเปลี่ยนรูป
              </span>
            </div>
          </div>

          {/* Action Bar (Always visible!) */}
          <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-xl bg-secondary/50 border border-border">
            <div className="flex items-center gap-2">
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
              <p className="text-sm font-semibold text-foreground">กำลังประมวลผลและอัปโหลดรูปภาพ...</p>
              <p className="text-xs text-muted-foreground">แปลงภาพอัตโนมัติ ไม่จำกัดขนาดไฟล์</p>
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
    </div>
  );
};
