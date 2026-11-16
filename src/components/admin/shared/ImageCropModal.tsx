import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import {
  AlertCircle,
  Check,
  Crop,
  Loader2,
  Move,
  RotateCcw,
  X,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import {
  MAX_CROP_ZOOM,
  MIN_CROP_ZOOM,
  clampCropTransform,
  computeBaseCoverScale,
  computeCropFrameDimensions,
  computeSourceCropRect,
  loadImageSafelyForCanvas,
  renderCroppedCanvasToBlob,
  zoomCropTransformAtPoint,
  type CropTransform,
  type NaturalImageSize,
} from '@/utils/imageCropUtils';

export interface ImageCropModalProps {
  open: boolean;
  imageSrc: string | null;
  aspect?: number;
  cropShape?: 'round' | 'rect';
  title?: string;
  description?: string;
  outputWidth?: number;
  outputHeight?: number;
  onCancel: () => void;
  onConfirm: (croppedBlob: Blob) => Promise<void> | void;
}

const DEFAULT_TRANSFORM: CropTransform = {
  panX: 0,
  panY: 0,
  zoom: MIN_CROP_ZOOM,
};

export const ImageCropModal = ({
  open,
  imageSrc,
  aspect = 1,
  cropShape = 'round',
  title = 'ปรับแต่งและครอปรูปภาพ',
  description = 'ลากรูปภาพเพื่อจัดตำแหน่งใบหน้า ใช้แถบซูม ลูกกลิ้งเมาส์ หรือจีบนิ้วเพื่อย่อ-ขยาย',
  outputWidth = 800,
  outputHeight,
  onCancel,
  onConfirm,
}: ImageCropModalProps) => {
  const viewportRef = useRef<HTMLDivElement>(null);
  const loadedImgRef = useRef<HTMLImageElement | null>(null);
  const revokeUrlRef = useRef<string | null>(null);
  const activePointersRef = useRef<Map<number, { x: number; y: number }>>(new Map());
  const pinchStateRef = useRef<{ initialDistance: number; initialZoom: number } | null>(null);

  const [viewportSize, setViewportSize] = useState({ width: 380, height: 300 });
  const [naturalSize, setNaturalSize] = useState<NaturalImageSize | null>(null);
  const [displaySrc, setDisplaySrc] = useState<string | null>(null);
  const [canExportCanvas, setCanExportCanvas] = useState(true);
  const [isLoadingImage, setIsLoadingImage] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [transform, setTransform] = useState<CropTransform>(DEFAULT_TRANSFORM);
  const transformRef = useRef<CropTransform>(DEFAULT_TRANSFORM);

  const updateTransform = useCallback((next: CropTransform) => {
    transformRef.current = next;
    setTransform(next);
  }, []);

  const safeAspect = Number.isFinite(aspect) && aspect > 0 ? aspect : 1;
  const resolvedOutputHeight = outputHeight ?? Math.round(outputWidth / safeAspect);

  const frameSize = useMemo(
    () => computeCropFrameDimensions(viewportSize.width, viewportSize.height, safeAspect),
    [viewportSize.width, viewportSize.height, safeAspect]
  );

  // Measure interactive viewport dynamically using layout dimensions (unaffected by dialog zoom animation)
  useEffect(() => {
    if (!open) return;
    const el = viewportRef.current;
    if (!el) return;

    const measure = () => {
      const w = el.clientWidth;
      const h = el.clientHeight;
      if (w > 0 && h > 0) {
        setViewportSize({ width: w, height: h });
      }
    };

    measure();

    if (typeof ResizeObserver !== 'undefined') {
      const observer = new ResizeObserver(measure);
      observer.observe(el);
      return () => observer.disconnect();
    }
    return undefined;
  }, [open, displaySrc]);

  // Keep pan clamped if viewport or frame size changes
  useEffect(() => {
    if (!naturalSize) return;
    const clamped = clampCropTransform(transformRef.current, naturalSize, frameSize);
    if (
      clamped.panX !== transformRef.current.panX ||
      clamped.panY !== transformRef.current.panY ||
      clamped.zoom !== transformRef.current.zoom
    ) {
      updateTransform(clamped);
    }
  }, [frameSize, naturalSize, updateTransform]);

  // Load image safely whenever modal opens with a source URL
  useEffect(() => {
    if (!open || !imageSrc) {
      if (revokeUrlRef.current) {
        URL.revokeObjectURL(revokeUrlRef.current);
        revokeUrlRef.current = null;
      }
      loadedImgRef.current = null;
      setDisplaySrc(null);
      setNaturalSize(null);
      setLoadError(null);
      return;
    }

    let cancelled = false;
    activePointersRef.current.clear();
    pinchStateRef.current = null;
    setIsDragging(false);
    setIsLoadingImage(true);
    setLoadError(null);
    setCanExportCanvas(true);
    updateTransform(DEFAULT_TRANSFORM);

    loadImageSafelyForCanvas(imageSrc)
      .then((result) => {
        if (cancelled) {
          if (result.revokeUrl) URL.revokeObjectURL(result.revokeUrl);
          return;
        }
        if (revokeUrlRef.current) {
          URL.revokeObjectURL(revokeUrlRef.current);
        }
        revokeUrlRef.current = result.revokeUrl;
        loadedImgRef.current = result.img;
        setDisplaySrc(result.img.src);
        setNaturalSize({
          width: result.img.naturalWidth || result.img.width,
          height: result.img.naturalHeight || result.img.height,
        });
        setCanExportCanvas(result.canExportCanvas);
      })
      .catch(() => {
        if (cancelled) return;
        setLoadError('ไม่สามารถโหลดรูปภาพสำหรับปรับแต่งได้ กรุณาลองเลือกรูปภาพใหม่อีกครั้ง');
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoadingImage(false);
        }
      });

    return () => {
      cancelled = true;
      if (revokeUrlRef.current) {
        URL.revokeObjectURL(revokeUrlRef.current);
        revokeUrlRef.current = null;
      }
    };
  }, [open, imageSrc, updateTransform]);

  // Non-passive wheel zoom listener so scrolling inside the cropper zooms smoothly instead of scrolling the modal
  useEffect(() => {
    const el = viewportRef.current;
    if (!el || !open) return;

    const handleWheel = (e: WheelEvent) => {
      if (!naturalSize || isLoadingImage || isProcessing) return;
      e.preventDefault();
      e.stopPropagation();

      const rect = el.getBoundingClientRect();
      const offsetX = e.clientX - (rect.left + rect.width / 2);
      const offsetY = e.clientY - (rect.top + rect.height / 2);
      const zoomFactor = Math.exp(-e.deltaY * 0.0018);
      const targetZoom = transformRef.current.zoom * zoomFactor;

      const next = zoomCropTransformAtPoint(
        transformRef.current,
        targetZoom,
        { x: offsetX, y: offsetY },
        naturalSize,
        frameSize
      );
      updateTransform(next);
    };

    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, [open, naturalSize, frameSize, isLoadingImage, isProcessing, updateTransform]);

  const handleZoomChange = (nextZoom: number) => {
    if (!naturalSize) return;
    const next = zoomCropTransformAtPoint(
      transformRef.current,
      nextZoom,
      { x: 0, y: 0 },
      naturalSize,
      frameSize
    );
    updateTransform(next);
  };

  const handleReset = () => {
    updateTransform(DEFAULT_TRANSFORM);
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!naturalSize || isLoadingImage || isProcessing) return;
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // Ignore if capture unavailable
    }
    activePointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (activePointersRef.current.size === 1) {
      setIsDragging(true);
      pinchStateRef.current = null;
    } else if (activePointersRef.current.size === 2) {
      const pts = Array.from(activePointersRef.current.values());
      const dist = Math.hypot(pts[1].x - pts[0].x, pts[1].y - pts[0].y);
      pinchStateRef.current = {
        initialDistance: Math.max(10, dist),
        initialZoom: transformRef.current.zoom,
      };
      setIsDragging(false);
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!naturalSize || !activePointersRef.current.has(e.pointerId)) return;
    const prevPt = activePointersRef.current.get(e.pointerId)!;
    const nextPt = { x: e.clientX, y: e.clientY };

    if (activePointersRef.current.size === 1) {
      const dx = nextPt.x - prevPt.x;
      const dy = nextPt.y - prevPt.y;
      activePointersRef.current.set(e.pointerId, nextPt);

      const next = clampCropTransform(
        {
          ...transformRef.current,
          panX: transformRef.current.panX + dx,
          panY: transformRef.current.panY + dy,
        },
        naturalSize,
        frameSize
      );
      updateTransform(next);
      return;
    }

    if (activePointersRef.current.size >= 2 && pinchStateRef.current) {
      const prevPts = Array.from(activePointersRef.current.values());
      const prevMidX = (prevPts[0].x + prevPts[1].x) / 2;
      const prevMidY = (prevPts[0].y + prevPts[1].y) / 2;

      activePointersRef.current.set(e.pointerId, nextPt);
      const currPts = Array.from(activePointersRef.current.values());
      const currDist = Math.hypot(currPts[1].x - currPts[0].x, currPts[1].y - currPts[0].y);
      const currMidX = (currPts[0].x + currPts[1].x) / 2;
      const currMidY = (currPts[0].y + currPts[1].y) / 2;

      const targetZoom =
        pinchStateRef.current.initialZoom * (currDist / pinchStateRef.current.initialDistance);

      const rect = viewportRef.current?.getBoundingClientRect();
      const offsetX = rect ? currMidX - (rect.left + rect.width / 2) : 0;
      const offsetY = rect ? currMidY - (rect.top + rect.height / 2) : 0;

      const panShifted: CropTransform = {
        ...transformRef.current,
        panX: transformRef.current.panX + (currMidX - prevMidX),
        panY: transformRef.current.panY + (currMidY - prevMidY),
      };
      const next = zoomCropTransformAtPoint(
        panShifted,
        targetZoom,
        { x: offsetX, y: offsetY },
        naturalSize,
        frameSize
      );
      updateTransform(next);
    }
  };

  const handlePointerUpOrCancel = (e: React.PointerEvent<HTMLDivElement>) => {
    activePointersRef.current.delete(e.pointerId);
    try {
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
    } catch {
      // Ignore if release unavailable
    }

    if (activePointersRef.current.size < 2) {
      pinchStateRef.current = null;
    }
    setIsDragging(activePointersRef.current.size === 1);
  };

  const handleConfirmCrop = async () => {
    if (!loadedImgRef.current || !naturalSize || !canExportCanvas || isProcessing) return;

    try {
      setIsProcessing(true);
      const sourceRect = computeSourceCropRect(naturalSize, frameSize, transformRef.current);
      const croppedBlob = await renderCroppedCanvasToBlob(
        loadedImgRef.current,
        sourceRect,
        outputWidth,
        resolvedOutputHeight,
        0.88
      );
      await onConfirm(croppedBlob);
    } catch (err: any) {
      console.error('Crop export error:', err);
      setLoadError(err?.message || 'เกิดข้อผิดพลาดในการบันทึกภาพที่ครอป กรุณาลองใหม่อีกครั้ง');
    } finally {
      setIsProcessing(false);
    }
  };

  const baseScale = naturalSize ? computeBaseCoverScale(naturalSize, frameSize) : 1;
  const baseDisplayW = naturalSize ? naturalSize.width * baseScale : frameSize.width;
  const baseDisplayH = naturalSize ? naturalSize.height * baseScale : frameSize.height;

  // Compute live miniature avatar preview dimensions matching the exact crop frame ratio
  const miniPreviewWidth = 56;
  const miniPreviewHeight = Math.round(miniPreviewWidth / safeAspect);
  const miniScaleRatio = frameSize.width > 0 ? miniPreviewWidth / frameSize.width : 1;

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen && !isProcessing) {
          onCancel();
        }
      }}
    >
      <DialogContent className="max-w-lg sm:max-w-xl p-0 overflow-hidden z-[60] gap-0">
        <DialogHeader className="px-5 pt-5 pb-3 border-b border-border bg-card">
          <DialogTitle className="flex items-center gap-2 text-foreground text-base sm:text-lg">
            <span className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Crop className="w-4 h-4" />
            </span>
            <span>{title}</span>
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm text-muted-foreground">
            {description}
          </DialogDescription>
        </DialogHeader>

        <div className="p-4 sm:p-5 space-y-4 bg-background">
          {/* Interactive Real-Time Crop Viewport */}
          <div
            ref={viewportRef}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUpOrCancel}
            onPointerCancel={handlePointerUpOrCancel}
            className={`relative w-full h-[270px] sm:h-[320px] rounded-2xl overflow-hidden bg-slate-950 border border-border select-none touch-none flex items-center justify-center ${
              isDragging ? 'cursor-grabbing' : 'cursor-grab'
            }`}
          >
            {isLoadingImage ? (
              <div className="flex flex-col items-center gap-2 text-white/80 pointer-events-none">
                <Loader2 className="w-8 h-8 animate-spin text-accent" />
                <span className="text-xs font-medium">กำลังเตรียมพื้นที่ปรับแต่งรูปภาพ...</span>
              </div>
            ) : loadError ? (
              <div className="flex flex-col items-center gap-2 px-6 text-center text-rose-300 pointer-events-none">
                <AlertCircle className="w-8 h-8 text-rose-400" />
                <p className="text-xs sm:text-sm font-medium">{loadError}</p>
              </div>
            ) : (
              displaySrc &&
              naturalSize && (
                <>
                  {/* Draggable & Zoomable Image */}
                  <img
                    src={displaySrc}
                    alt="Crop preview"
                    draggable={false}
                    style={{
                      width: `${baseDisplayW}px`,
                      height: `${baseDisplayH}px`,
                      maxWidth: 'none',
                      maxHeight: 'none',
                      transform: `translate3d(${transform.panX}px, ${transform.panY}px, 0) scale(${transform.zoom})`,
                      transformOrigin: 'center center',
                    }}
                    className="pointer-events-none select-none will-change-transform"
                  />

                  {/* Crop Frame Mask + 3x3 Guideline Grid */}
                  <div
                    style={{
                      width: `${frameSize.width}px`,
                      height: `${frameSize.height}px`,
                    }}
                    className={`pointer-events-none absolute overflow-hidden border-2 border-white/95 shadow-[0_0_0_9999px_rgba(2,6,23,0.68)] ring-1 ring-accent/70 ${
                      cropShape === 'round' ? 'rounded-full' : 'rounded-2xl'
                    }`}
                  >
                    {/* Rule-of-Thirds Grid */}
                    <div className="absolute inset-y-0 left-1/3 w-px bg-white/30" />
                    <div className="absolute inset-y-0 left-2/3 w-px bg-white/30" />
                    <div className="absolute inset-x-0 top-1/3 h-px bg-white/30" />
                    <div className="absolute inset-x-0 top-2/3 h-px bg-white/30" />
                    {/* Subtle Center Crosshair */}
                    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center">
                      <div className="w-3.5 h-px bg-accent/80" />
                      <div className="absolute h-3.5 w-px bg-accent/80" />
                    </div>
                  </div>

                  {/* Interactive Hint Badge */}
                  <div className="pointer-events-none absolute top-2.5 left-2.5 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-950/75 text-white/90 text-[11px] backdrop-blur-xs border border-white/10">
                    <Move className="w-3 h-3 text-accent" />
                    <span>ลากจัดวางใบหน้า</span>
                  </div>
                  <div className="pointer-events-none absolute top-2.5 right-2.5 px-2.5 py-1 rounded-full bg-slate-950/75 text-accent font-mono text-[11px] font-semibold backdrop-blur-xs border border-white/10">
                    {Math.round(transform.zoom * 100)}%
                  </div>
                </>
              )
            )}
          </div>

          {!canExportCanvas && !loadError && (
            <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-300 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-500" />
              <span>
                รูปภาพจากลิงก์ภายนอกนี้ถูกจำกัดสิทธิ์การครอปจากเซิร์ฟเวอร์ต้นทาง (CORS)
                กรุณากด <strong>“เลือกรูปภาพใหม่จากเครื่อง”</strong> เพื่ออัปโหลดไฟล์และครอปตำแหน่งใหม่
              </span>
            </div>
          )}

          {/* Controls Row: Live Avatar Preview + Zoom Slider */}
          <div className="p-3.5 rounded-xl bg-secondary/50 border border-border space-y-3">
            <div className="flex items-center justify-between gap-3">
              {/* Live Real-time Web Avatar Preview */}
              <div className="flex items-center gap-3 min-w-0">
                <div
                  style={{
                    width: `${miniPreviewWidth}px`,
                    height: `${miniPreviewHeight}px`,
                  }}
                  className={`relative overflow-hidden bg-gradient-to-br from-primary to-navy-light border-2 border-accent shadow-sm shrink-0 flex items-center justify-center ${
                    cropShape === 'round' ? 'rounded-full' : 'rounded-xl'
                  }`}
                >
                  {displaySrc && naturalSize && (
                    <img
                      src={displaySrc}
                      alt="Live avatar preview"
                      draggable={false}
                      style={{
                        width: `${baseDisplayW * miniScaleRatio}px`,
                        height: `${baseDisplayH * miniScaleRatio}px`,
                        maxWidth: 'none',
                        maxHeight: 'none',
                        transform: `translate3d(${transform.panX * miniScaleRatio}px, ${transform.panY * miniScaleRatio}px, 0) scale(${transform.zoom})`,
                        transformOrigin: 'center center',
                      }}
                      className="pointer-events-none select-none"
                    />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-foreground">ตัวอย่างแสดงผลบนหน้าเว็บ</p>
                  <p className="text-[11px] text-muted-foreground">
                    {cropShape === 'round'
                      ? 'กรอบวงกลม (1:1) ตามหน้าทำเนียบบุคลากร'
                      : `กรอบสัดส่วน ${safeAspect === 1 ? '1:1' : `${safeAspect.toFixed(2)}:1`}`}
                  </p>
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleReset}
                disabled={isLoadingImage || isProcessing}
                className="h-8 px-2.5 text-xs gap-1.5 shrink-0"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                รีเซ็ต
              </Button>
            </div>

            {/* Zoom Slider */}
            <div className="flex items-center gap-2.5 pt-1">
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-8 w-8 shrink-0"
                onClick={() => handleZoomChange(transform.zoom - 0.1)}
                disabled={isLoadingImage || isProcessing || transform.zoom <= MIN_CROP_ZOOM}
                title="ซูมออก"
              >
                <ZoomOut className="w-4 h-4" />
              </Button>

              <Slider
                value={[transform.zoom]}
                min={MIN_CROP_ZOOM}
                max={MAX_CROP_ZOOM}
                step={0.01}
                onValueChange={([value]) => handleZoomChange(value)}
                disabled={isLoadingImage || isProcessing || !naturalSize}
                aria-label="ระดับการซูมรูปภาพ"
                className="flex-1"
              />

              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-8 w-8 shrink-0"
                onClick={() => handleZoomChange(transform.zoom + 0.1)}
                disabled={isLoadingImage || isProcessing || transform.zoom >= MAX_CROP_ZOOM}
                title="ซูมเข้า"
              >
                <ZoomIn className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        <DialogFooter className="px-5 py-3.5 border-t border-border bg-card gap-2 sm:gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isProcessing}
            className="gap-1.5"
          >
            <X className="w-4 h-4" />
            ยกเลิก
          </Button>
          <Button
            type="button"
            onClick={handleConfirmCrop}
            disabled={isProcessing || isLoadingImage || Boolean(loadError) || !canExportCanvas || !naturalSize}
            className="gap-1.5"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                กำลังประมวลผล...
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                ยืนยัน/บันทึกตำแหน่ง
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
