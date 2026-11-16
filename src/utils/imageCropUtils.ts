import { canvasToBlobWithFallback, compressImage, isHeicFile } from './imageUtils.ts';

export interface CropFrameSize {
  width: number;
  height: number;
}

export interface NaturalImageSize {
  width: number;
  height: number;
}

export interface CropTransform {
  panX: number;
  panY: number;
  zoom: number;
}

export interface SourceCropRect {
  sx: number;
  sy: number;
  sw: number;
  sh: number;
}

export const MIN_CROP_ZOOM = 1;
export const MAX_CROP_ZOOM = 3;

/**
 * Clamps a zoom factor safely within [min, max].
 */
export const clampZoom = (
  zoom: number,
  min: number = MIN_CROP_ZOOM,
  max: number = MAX_CROP_ZOOM
): number => {
  if (!Number.isFinite(zoom)) return min;
  return Math.max(min, Math.min(max, zoom));
};

/**
 * Computes centered crop frame CSS dimensions inside a viewport while leaving
 * breathing room around the frame so the user sees the surrounding image context.
 */
export const computeCropFrameDimensions = (
  viewportWidth: number,
  viewportHeight: number,
  aspect: number = 1
): CropFrameSize => {
  const safeAspect = Number.isFinite(aspect) && aspect > 0 ? aspect : 1;
  if (!Number.isFinite(viewportWidth) || !Number.isFinite(viewportHeight) || viewportWidth <= 0 || viewportHeight <= 0) {
    const fallbackW = 240;
    return {
      width: fallbackW,
      height: Math.round(fallbackW / safeAspect),
    };
  }

  const maxW = Math.max(80, viewportWidth * 0.82);
  const maxH = Math.max(80, viewportHeight * 0.82);

  let width = maxW;
  let height = width / safeAspect;
  if (height > maxH) {
    height = maxH;
    width = height * safeAspect;
  }

  return {
    width: Math.round(width),
    height: Math.round(height),
  };
};

/**
 * Computes the base scale (natural px -> CSS px) so the image completely covers the crop frame at zoom = 1.
 */
export const computeBaseCoverScale = (
  natural: NaturalImageSize,
  frame: CropFrameSize
): number => {
  if (natural.width <= 0 || natural.height <= 0 || frame.width <= 0 || frame.height <= 0) {
    return 1;
  }
  return Math.max(frame.width / natural.width, frame.height / natural.height);
};

/**
 * Computes the maximum allowed pan offsets (in CSS px) so the image always covers the entire crop frame.
 */
export const computeMaxPan = (
  natural: NaturalImageSize,
  frame: CropFrameSize,
  zoom: number
): { maxPanX: number; maxPanY: number } => {
  const safeZoom = clampZoom(zoom);
  const scale = computeBaseCoverScale(natural, frame) * safeZoom;
  const displayW = natural.width * scale;
  const displayH = natural.height * scale;

  return {
    maxPanX: Math.max(0, (displayW - frame.width) / 2),
    maxPanY: Math.max(0, (displayH - frame.height) / 2),
  };
};

/**
 * Clamps zoom and pan offsets so the crop frame never exposes empty background gaps.
 */
export const clampCropTransform = (
  transform: CropTransform,
  natural: NaturalImageSize,
  frame: CropFrameSize
): CropTransform => {
  const zoom = clampZoom(transform.zoom);
  const { maxPanX, maxPanY } = computeMaxPan(natural, frame, zoom);
  const panX = Number.isFinite(transform.panX)
    ? Math.max(-maxPanX, Math.min(maxPanX, transform.panX))
    : 0;
  const panY = Number.isFinite(transform.panY)
    ? Math.max(-maxPanY, Math.min(maxPanY, transform.panY))
    : 0;

  return { panX, panY, zoom };
};

/**
 * Updates zoom while keeping the image point under cursorOffsetFromCenter stationary,
 * then clamps pan within covered frame bounds.
 */
export const zoomCropTransformAtPoint = (
  current: CropTransform,
  nextZoom: number,
  cursorOffsetFromCenter: { x: number; y: number },
  natural: NaturalImageSize,
  frame: CropFrameSize
): CropTransform => {
  const prevZoom = clampZoom(current.zoom);
  const targetZoom = clampZoom(nextZoom);
  const ratio = targetZoom / prevZoom;

  const nextPanX = cursorOffsetFromCenter.x - (cursorOffsetFromCenter.x - current.panX) * ratio;
  const nextPanY = cursorOffsetFromCenter.y - (cursorOffsetFromCenter.y - current.panY) * ratio;

  return clampCropTransform(
    { panX: nextPanX, panY: nextPanY, zoom: targetZoom },
    natural,
    frame
  );
};

/**
 * Maps the visible CSS crop frame + transform back into exact natural-image source pixel coordinates.
 */
export const computeSourceCropRect = (
  natural: NaturalImageSize,
  frame: CropFrameSize,
  transform: CropTransform
): SourceCropRect => {
  if (natural.width <= 0 || natural.height <= 0 || frame.width <= 0 || frame.height <= 0) {
    return { sx: 0, sy: 0, sw: Math.max(1, natural.width), sh: Math.max(1, natural.height) };
  }

  const clamped = clampCropTransform(transform, natural, frame);
  const displayScale = computeBaseCoverScale(natural, frame) * clamped.zoom;
  const displayW = natural.width * displayScale;
  const displayH = natural.height * displayScale;

  const sw = Math.min(natural.width, frame.width / displayScale);
  const sh = Math.min(natural.height, frame.height / displayScale);

  const sxRaw = ((displayW - frame.width) / 2 - clamped.panX) / displayScale;
  const syRaw = ((displayH - frame.height) / 2 - clamped.panY) / displayScale;

  const sx = Math.max(0, Math.min(natural.width - sw, sxRaw));
  const sy = Math.max(0, Math.min(natural.height - sh, syRaw));

  return { sx, sy, sw, sh };
};

/**
 * Prepares a user-selected image File for smooth interactive cropping.
 * Converts iOS HEIC/HEIF files and normalizes huge (>2.5MB) camera exports to max 2400px.
 */
export const prepareImageFileForCrop = async (
  file: File
): Promise<{ objectUrl: string; isHeicConverted: boolean }> => {
  let workingBlob: Blob = file;
  let isHeicConverted = false;

  if (isHeicFile(file)) {
    try {
      const heic2anyModule = await import('heic2any');
      const heic2any = (heic2anyModule.default || heic2anyModule) as (options: {
        blob: Blob;
        toType?: string;
        quality?: number;
      }) => Promise<Blob | Blob[]>;
      const converted = await heic2any({
        blob: file,
        toType: 'image/jpeg',
        quality: 0.92,
      });
      const singleBlob = Array.isArray(converted) ? converted[0] : converted;
      if (singleBlob && singleBlob.size > 0) {
        workingBlob = singleBlob;
        isHeicConverted = true;
      }
    } catch (err) {
      console.warn('HEIC conversion for cropper note:', err);
    }
  }

  const isAnimatedOrVector = file.type === 'image/svg+xml' || file.type === 'image/gif';
  if (!isAnimatedOrVector && workingBlob.size > 2.5 * 1024 * 1024) {
    try {
      const workingFile =
        workingBlob instanceof File
          ? workingBlob
          : new File([workingBlob], file.name.replace(/\.[^.]+$/, '.jpg'), {
              type: workingBlob.type || 'image/jpeg',
            });
      const optimized = await compressImage(workingFile, {
        maxWidth: 2400,
        maxHeight: 2400,
        quality: 0.92,
      });
      if (optimized && optimized.size > 0) {
        workingBlob = optimized;
      }
    } catch (optErr) {
      console.warn('Pre-crop optimization skipped:', optErr);
    }
  }

  return {
    objectUrl: URL.createObjectURL(workingBlob),
    isHeicConverted,
  };
};

const loadImageElement = (
  src: string,
  crossOrigin?: 'anonymous'
): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    if (crossOrigin) {
      img.crossOrigin = crossOrigin;
    }
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = src;
  });
};

/**
 * Loads an image source (data:, blob:, relative, or remote HTTP/HTTPS URL) safely
 * for HTML5 Canvas export without hitting Chrome's cached non-CORS image taint error.
 */
export const loadImageSafelyForCanvas = async (
  src: string
): Promise<{
  img: HTMLImageElement;
  revokeUrl: string | null;
  canExportCanvas: boolean;
}> => {
  const isRemoteHttp = /^https?:\/\//i.test(src);

  if (!isRemoteHttp) {
    const img = await loadImageElement(src);
    return { img, revokeUrl: null, canExportCanvas: true };
  }

  // 1. Prefer CORS fetch -> local Blob URL so Canvas never inherits a non-CORS cached response
  try {
    const response = await fetch(src, { mode: 'cors', cache: 'no-cache' });
    if (response.ok) {
      const blob = await response.blob();
      if (blob.size > 0) {
        const blobUrl = URL.createObjectURL(blob);
        try {
          const img = await loadImageElement(blobUrl);
          return { img, revokeUrl: blobUrl, canExportCanvas: true };
        } catch {
          URL.revokeObjectURL(blobUrl);
        }
      }
    }
  } catch {
    // Fall through to crossOrigin image attempt
  }

  // 2. Fallback: load with crossOrigin="anonymous"
  try {
    const img = await loadImageElement(src, 'anonymous');
    return { img, revokeUrl: null, canExportCanvas: true };
  } catch {
    // Fall through to display-only non-CORS load
  }

  // 3. Last resort: load without CORS for preview while flagging Canvas export restriction
  const img = await loadImageElement(src);
  return { img, revokeUrl: null, canExportCanvas: false };
};

/**
 * Renders the exact cropped region onto an offscreen HTML5 Canvas and returns a compressed Blob.
 */
export const renderCroppedCanvasToBlob = async (
  img: HTMLImageElement,
  sourceRect: SourceCropRect,
  outputWidth: number = 800,
  outputHeight: number = 800,
  quality: number = 0.88
): Promise<Blob> => {
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(outputWidth));
  canvas.height = Math.max(1, Math.round(outputHeight));

  const ctx =
    canvas.getContext('2d', {
      alpha: false,
      willReadFrequently: false,
      colorSpace: 'srgb',
    }) || canvas.getContext('2d');

  if (!ctx) {
    throw new Error('ไม่สามารถสร้าง Canvas 2D Context ได้');
  }

  // Fill neutral white base in case source PNG had transparent pixels
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(
    img,
    sourceRect.sx,
    sourceRect.sy,
    sourceRect.sw,
    sourceRect.sh,
    0,
    0,
    canvas.width,
    canvas.height
  );

  return canvasToBlobWithFallback(canvas, quality, 'image/webp');
};
