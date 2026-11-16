import { useRef, useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  GripVertical,
  ImagePlus,
  Link2,
  Loader2,
  Star,
  Trash2,
  Upload,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { compressImage, compressionPresets } from '@/utils/imageUtils';
import { deleteStorageImage } from '@/utils/storageUtils';
import { NEWSLETTER_MAX_IMAGES, NEWSLETTER_MIN_IMAGES } from '@/utils/newsletterUtils';

interface NewsletterMultiImageUploaderProps {
  images: string[];
  onChange: (nextImages: string[]) => void;
  disabled?: boolean;
}

const isValidImageFile = (file: File): boolean => {
  const ext = file.name.split('.').pop()?.toLowerCase();
  return (
    file.type.startsWith('image/') ||
    ['heic', 'heif', 'jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext || '')
  );
};

const uploadNewsletterImageFile = async (file: File): Promise<string> => {
  const compressedBlob = await compressImage(file, compressionPresets.gallery);
  const isWebP = compressedBlob.type === 'image/webp';
  const isPng = compressedBlob.type === 'image/png';
  const fileExt = isPng ? 'png' : isWebP ? 'webp' : 'jpg';
  const contentType = isPng ? 'image/png' : isWebP ? 'image/webp' : 'image/jpeg';
  const fileName = `newsletters/${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${fileExt}`;

  let finalUrl = '';
  try {
    const { data, error } = await supabase.storage
      .from('images')
      .upload(fileName, compressedBlob, {
        cacheControl: '3600',
        upsert: true,
        contentType,
      });

    if (!error && data?.path) {
      const { data: pub } = supabase.storage.from('images').getPublicUrl(data.path);
      finalUrl = pub?.publicUrl || '';
    }
  } catch (err) {
    console.warn('Newsletter storage upload fallback note:', err);
  }

  if (!finalUrl || finalUrl.startsWith('blob:')) {
    finalUrl = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve((reader.result as string) || '');
      reader.onerror = () => resolve('');
      reader.readAsDataURL(compressedBlob);
    });
  }

  if (!finalUrl) {
    throw new Error(`ไม่สามารถประมวลผลรูปภาพ ${file.name} ได้`);
  }

  return finalUrl;
};

interface SortablePhotoCardProps {
  id: string;
  url: string;
  index: number;
  total: number;
  disabled?: boolean;
  onSetHero: () => void;
  onMoveLeft: () => void;
  onMoveRight: () => void;
  onReplace: () => void;
  onRemove: () => void;
}

const SortablePhotoCard = ({
  id,
  url,
  index,
  total,
  disabled,
  onSetHero,
  onMoveLeft,
  onMoveRight,
  onReplace,
  onRemove,
}: SortablePhotoCardProps) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.55 : 1,
  };

  const isHero = index === 0;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group relative rounded-xl overflow-hidden border-2 bg-card shadow-xs transition-all ${
        isHero
          ? 'border-accent ring-2 ring-accent/25'
          : 'border-border hover:border-primary/50'
      }`}
    >
      {/* Top Drag & Status Overlay */}
      <div className="relative aspect-[4/3] bg-slate-900 overflow-hidden">
        <img
          src={url}
          alt={`ภาพประกอบจดหมายข่าว #${index + 1}`}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover"
        />

        <div className="absolute top-1.5 left-1.5 right-1.5 flex items-center justify-between gap-1">
          <button
            type="button"
            {...attributes}
            {...listeners}
            disabled={disabled}
            title="ลากเพื่อสลับลำดับรูปภาพ"
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-950/80 text-white text-[10px] font-semibold cursor-grab active:cursor-grabbing backdrop-blur-xs"
          >
            <GripVertical className="w-3 h-3 text-accent" />
            <span>#{index + 1}</span>
          </button>

          {isHero ? (
            <Badge className="bg-accent text-accent-foreground text-[10px] px-2 py-0 h-5 gap-1 shadow">
              <Star className="w-2.5 h-2.5 fill-current" />
              ภาพหลัก
            </Badge>
          ) : (
            <button
              type="button"
              onClick={onSetHero}
              disabled={disabled}
              title="ตั้งเป็นภาพเด่น/ภาพหลัก"
              className="px-2 py-0.5 rounded-full bg-slate-950/75 hover:bg-accent hover:text-accent-foreground text-white text-[10px] font-medium transition-colors"
            >
              ตั้งเป็นภาพหลัก
            </button>
          )}
        </div>
      </div>

      {/* Controls Bar */}
      <div className="p-1.5 bg-secondary/50 border-t border-border flex items-center justify-between gap-1">
        <div className="flex items-center gap-0.5">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            disabled={disabled || index === 0}
            onClick={onMoveLeft}
            title="เลื่อนไปก่อนหน้า"
          >
            <ArrowLeft className="w-3 h-3" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            disabled={disabled || index === total - 1}
            onClick={onMoveRight}
            title="เลื่อนไปถัดไป"
          >
            <ArrowRight className="w-3 h-3" />
          </Button>
        </div>

        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-6 px-1.5 text-[10px] text-primary hover:bg-primary/10"
            disabled={disabled}
            onClick={onReplace}
            title="เปลี่ยนรูปภาพนี้"
          >
            เปลี่ยน
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-destructive hover:bg-destructive/10"
            disabled={disabled}
            onClick={onRemove}
            title="ลบรูปภาพนี้"
          >
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export const NewsletterMultiImageUploader = ({
  images,
  onChange,
  disabled = false,
}: NewsletterMultiImageUploaderProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgressText, setUploadProgressText] = useState('');
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [replaceIndex, setReplaceIndex] = useState<number | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const replaceInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // Create unique IDs per slot combining index and URL signature so dnd-kit tracks items reliably
  const itemIds = images.map((url, idx) => `${idx}::${url.slice(0, 64)}`);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = itemIds.indexOf(String(active.id));
    const newIndex = itemIds.indexOf(String(over.id));
    if (oldIndex !== -1 && newIndex !== -1) {
      onChange(arrayMove(images, oldIndex, newIndex));
    }
  };

  const handleFilesBatch = async (fileList: FileList | File[]) => {
    const rawFiles = Array.from(fileList);
    if (rawFiles.length === 0) return;

    const validFiles = rawFiles.filter(isValidImageFile);
    if (validFiles.length === 0) {
      toast({
        variant: 'destructive',
        title: 'ประเภทไฟล์ไม่ถูกต้อง',
        description: 'กรุณาเลือกไฟล์รูปภาพ (JPG, PNG, WebP, HEIC)',
      });
      return;
    }

    const remainingSlots = NEWSLETTER_MAX_IMAGES - images.length;
    if (remainingSlots <= 0) {
      toast({
        variant: 'destructive',
        title: `อัปโหลดได้สูงสุด ${NEWSLETTER_MAX_IMAGES} รูปภาพ`,
        description: 'กรุณาลบรูปภาพเดิมออกก่อน หากต้องการเพิ่มรูปใหม่',
      });
      return;
    }

    const filesToUpload = validFiles.slice(0, remainingSlots);
    if (validFiles.length > remainingSlots) {
      toast({
        title: `รับรูปภาพได้สูงสุด ${NEWSLETTER_MAX_IMAGES} รูป`,
        description: `ระบบนำเข้า ${filesToUpload.length} รูปแรกให้โดยอัตโนมัติ`,
      });
    }

    setIsUploading(true);
    try {
      const uploadedUrls: string[] = [];
      for (let i = 0; i < filesToUpload.length; i++) {
        setUploadProgressText(`กำลังอัปโหลดรูปที่ ${i + 1}/${filesToUpload.length}...`);
        const url = await uploadNewsletterImageFile(filesToUpload[i]);
        uploadedUrls.push(url);
      }

      onChange([...images, ...uploadedUrls].slice(0, NEWSLETTER_MAX_IMAGES));
      toast({
        title: 'อัปโหลดรูปภาพสำเร็จ',
        description: `เพิ่มรูปภาพประกอบจดหมายข่าว ${uploadedUrls.length} รูปเรียบร้อยแล้ว`,
      });
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'อัปโหลดไม่สำเร็จ',
        description: err?.message || 'เกิดข้อผิดพลาดระหว่างอัปโหลดรูปภาพ',
      });
    } finally {
      setIsUploading(false);
      setUploadProgressText('');
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleReplaceSingleFile = async (file: File) => {
    if (replaceIndex === null || !isValidImageFile(file)) return;
    const targetIdx = replaceIndex;
    setReplaceIndex(null);

    setIsUploading(true);
    setUploadProgressText(`กำลังเปลี่ยนรูปที่ #${targetIdx + 1}...`);
    try {
      const newUrl = await uploadNewsletterImageFile(file);
      const oldUrl = images[targetIdx];
      const next = images.map((u, idx) => (idx === targetIdx ? newUrl : u));
      onChange(next);
      if (oldUrl && oldUrl.startsWith('http')) {
        void deleteStorageImage(oldUrl);
      }
      toast({
        title: 'เปลี่ยนรูปภาพสำเร็จ',
        description: `อัปเดตรูปภาพลำดับที่ #${targetIdx + 1} เรียบร้อยแล้ว`,
      });
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'เปลี่ยนรูปภาพไม่สำเร็จ',
        description: err?.message || 'เกิดข้อผิดพลาด',
      });
    } finally {
      setIsUploading(false);
      setUploadProgressText('');
      if (replaceInputRef.current) replaceInputRef.current.value = '';
    }
  };

  const handleAddByUrl = () => {
    const trimmed = urlInput.trim();
    if (!trimmed) return;
    if (images.length >= NEWSLETTER_MAX_IMAGES) {
      toast({
        variant: 'destructive',
        title: `เพิ่มได้สูงสุด ${NEWSLETTER_MAX_IMAGES} รูปภาพ`,
      });
      return;
    }
    if (images.includes(trimmed)) {
      toast({ variant: 'destructive', title: 'ลิงก์รูปภาพนี้ถูกเพิ่มไว้แล้ว' });
      return;
    }
    onChange([...images, trimmed]);
    setUrlInput('');
  };

  const handleRemoveAt = (idx: number) => {
    const next = images.filter((_, i) => i !== idx);
    onChange(next);
  };

  const handleMove = (fromIdx: number, toIdx: number) => {
    if (toIdx < 0 || toIdx >= images.length) return;
    onChange(arrayMove(images, fromIdx, toIdx));
  };

  const isRecommendedCount =
    images.length >= NEWSLETTER_MIN_IMAGES && images.length <= NEWSLETTER_MAX_IMAGES;

  return (
    <div className="space-y-3">
      {/* Hidden Multi-file & Replace Inputs */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*,.heic,.heif,.webp,.png,.jpg,.jpeg"
        className="hidden"
        disabled={disabled || isUploading}
        onChange={(e) => {
          if (e.target.files) {
            void handleFilesBatch(e.target.files);
          }
        }}
      />
      <input
        ref={replaceInputRef}
        type="file"
        accept="image/*,.heic,.heif,.webp,.png,.jpg,.jpeg"
        className="hidden"
        disabled={disabled || isUploading}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void handleReplaceSingleFile(file);
        }}
      />

      {/* Counter & Status Header */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className={`font-mono text-xs ${
              isRecommendedCount
                ? 'bg-emerald-500/15 text-emerald-700 border-emerald-300 dark:text-emerald-300'
                : 'bg-amber-500/15 text-amber-800 border-amber-300 dark:text-amber-300'
            }`}
          >
            {isRecommendedCount ? (
              <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
            ) : (
              <AlertCircle className="w-3.5 h-3.5 mr-1" />
            )}
            รูปภาพ {images.length} / {NEWSLETTER_MAX_IMAGES} รูป
          </Badge>

          <span className="text-xs text-muted-foreground">
            {images.length < NEWSLETTER_MIN_IMAGES
              ? `แนะนำ 4–6 รูปภาพ (เพิ่มอีก ${NEWSLETTER_MIN_IMAGES - images.length} รูป)`
              : 'ครบจำนวน 4–6 รูป พร้อมจัดวางเทมเพลตและ AI'}
          </span>
        </div>

        {images.length < NEWSLETTER_MAX_IMAGES && (
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={disabled || isUploading}
            onClick={() => fileInputRef.current?.click()}
            className="gap-1.5 text-xs border-primary/40 text-primary hover:bg-primary/5"
          >
            <ImagePlus className="w-3.5 h-3.5" />
            เลือกรูปภาพ (หลายรูปพร้อมกัน)
          </Button>
        )}
      </div>

      {/* Sortable Image Grid */}
      {images.length > 0 && (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={itemIds} strategy={rectSortingStrategy}>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {images.map((url, idx) => (
                <SortablePhotoCard
                  key={itemIds[idx]}
                  id={itemIds[idx]}
                  url={url}
                  index={idx}
                  total={images.length}
                  disabled={disabled || isUploading}
                  onSetHero={() => handleMove(idx, 0)}
                  onMoveLeft={() => handleMove(idx, idx - 1)}
                  onMoveRight={() => handleMove(idx, idx + 1)}
                  onReplace={() => {
                    setReplaceIndex(idx);
                    replaceInputRef.current?.click();
                  }}
                  onRemove={() => handleRemoveAt(idx)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {/* Dropzone */}
      {images.length < NEWSLETTER_MAX_IMAGES && (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsDraggingOver(true);
          }}
          onDragLeave={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsDraggingOver(false);
          }}
          onDrop={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsDraggingOver(false);
            if (!disabled && !isUploading && e.dataTransfer.files) {
              void handleFilesBatch(e.dataTransfer.files);
            }
          }}
          onClick={() => !disabled && !isUploading && fileInputRef.current?.click()}
          className={`rounded-xl border-2 border-dashed p-4 text-center transition-all cursor-pointer ${
            isDraggingOver
              ? 'border-primary bg-primary/10'
              : 'border-border hover:border-primary/70 bg-secondary/30 hover:bg-secondary/50'
          }`}
        >
          {isUploading ? (
            <div className="flex flex-col items-center gap-1.5 py-2">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
              <p className="text-xs font-semibold text-foreground">
                {uploadProgressText || 'กำลังอัปโหลดรูปภาพไปยัง Supabase Storage...'}
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-1.5 py-1">
              <Upload className="w-5 h-5 text-primary" />
              <p className="text-xs font-semibold text-foreground">
                คลิกหรือลากรูปภาพมาวางที่นี่ (เลือกได้ทีละหลายรูป สูงสุด {NEWSLETTER_MAX_IMAGES} รูป)
              </p>
              <p className="text-[11px] text-muted-foreground">
                ภาพแรก (#1) จะใช้เป็นภาพเด่นหลัก ลากการ์ดหรือกด “ตั้งเป็นภาพหลัก” เพื่อสลับตำแหน่งได้
              </p>
            </div>
          )}
        </div>
      )}

      {/* Optional Direct URL Input */}
      {images.length < NEWSLETTER_MAX_IMAGES && (
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Link2 className="w-3.5 h-3.5 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddByUrl();
                }
              }}
              placeholder="หรือวาง URL รูปภาพเพิ่มเติม (เช่น https://...)"
              className="pl-8 h-8 text-xs"
              disabled={disabled || isUploading}
            />
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 text-xs shrink-0"
            disabled={disabled || isUploading || !urlInput.trim()}
            onClick={handleAddByUrl}
          >
            เพิ่ม URL
          </Button>
        </div>
      )}
    </div>
  );
};
