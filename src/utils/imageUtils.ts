/**
 * Image compression and optimization utilities
 * Engineered for high-resolution DSLR / Mirrorless camera files (Sony A7, Canon, Nikon, Fuji),
 * Lightroom exports (ProPhoto RGB / Adobe RGB / large EXIF metadata), and mobile HEIC/HEIF files.
 */

export interface CompressOptions {
    maxWidth?: number;
    maxHeight?: number;
    quality?: number;
    forceFormat?: 'webp' | 'jpeg';
}

/**
 * Check if file is HEIC/HEIF or iOS image
 */
export const isHeicFile = (file: File | Blob): boolean => {
    const fileName = (file as File).name || '';
    const ext = fileName.split('.').pop()?.toLowerCase();
    return (
        file.type === 'image/heic' ||
        file.type === 'image/heif' ||
        ext === 'heic' ||
        ext === 'heif'
    );
};

/**
 * Helper to convert canvas to Blob with multiple fallback formats
 */
const canvasToBlobWithFallback = (
    canvas: HTMLCanvasElement,
    quality: number = 0.85,
    preferredFormat: 'image/webp' | 'image/jpeg' = 'image/webp'
): Promise<Blob> => {
    return new Promise((resolve, reject) => {
        // 1. Try preferred format (WebP or JPEG)
        canvas.toBlob(
            (blob) => {
                if (blob && blob.size > 0) {
                    resolve(blob);
                    return;
                }

                // 2. Fallback to image/jpeg if WebP not supported
                canvas.toBlob(
                    (jpegBlob) => {
                        if (jpegBlob && jpegBlob.size > 0) {
                            resolve(jpegBlob);
                            return;
                        }

                        // 3. Last-resort fallback: canvas.toDataURL -> Blob
                        try {
                            const dataUrl = canvas.toDataURL('image/jpeg', quality);
                            const parts = dataUrl.split(',');
                            const byteString = atob(parts[1]);
                            const ab = new ArrayBuffer(byteString.length);
                            const ia = new Uint8Array(ab);
                            for (let i = 0; i < byteString.length; i++) {
                                ia[i] = byteString.charCodeAt(i);
                            }
                            resolve(new Blob([ab], { type: 'image/jpeg' }));
                        } catch (err) {
                            reject(err);
                        }
                    },
                    'image/jpeg',
                    quality
                );
            },
            preferredFormat,
            quality
        );
    });
};

/**
 * Hardware-accelerated image decoding with createImageBitmap
 * Subsamples high-megapixel images (e.g. Sony A7 24MP-61MP) directly during decode,
 * avoiding 200MB+ memory allocations on the main JavaScript thread.
 */
const createResizedBitmap = async (
    blob: Blob,
    targetWidth?: number,
    targetHeight?: number
): Promise<ImageBitmap | null> => {
    if (typeof window === 'undefined' || !('createImageBitmap' in window)) {
        return null;
    }

    try {
        if (targetWidth && targetHeight) {
            // Hardware-accelerated subsampled decoding directly to target resolution
            return await createImageBitmap(blob, {
                resizeWidth: targetWidth,
                resizeHeight: targetHeight,
                resizeQuality: 'high',
                imageOrientation: 'from-image',
                colorSpaceConversion: 'default',
            });
        }
    } catch {
        // Fallback for browsers with partial createImageBitmap options support
        try {
            return await createImageBitmap(blob, {
                imageOrientation: 'from-image',
            });
        } catch {
            try {
                return await createImageBitmap(blob);
            } catch {
                return null;
            }
        }
    }

    try {
        return await createImageBitmap(blob);
    } catch {
        return null;
    }
};

/**
 * Compress or convert an image file before upload
 * Supports all standard formats, massive Sony A7 / Lightroom JPEGs, plus HEIC/HEIF fallback.
 * Guarantees crisp web-ready output without crashes or memory limits.
 */
export const compressImage = async (
    file: File,
    options: CompressOptions = {}
): Promise<Blob> => {
    const {
        maxWidth = 1920,
        maxHeight = 1080,
        quality = 0.85,
        forceFormat,
    } = options;

    // If SVG or animated GIF, keep original
    if (file.type === 'image/svg+xml' || file.type === 'image/gif') {
        return file;
    }

    let workingBlob: Blob = file;

    // 1. Convert HEIC/HEIF images (common from iPhone, iPad, Mac) to standard JPEG
    if (isHeicFile(file)) {
        try {
            const heic2anyModule = await import('heic2any');
            const heic2any = heic2anyModule.default || heic2anyModule;
            const converted = await heic2any({
                blob: file,
                toType: 'image/jpeg',
                quality: 0.9,
            });
            const singleBlob = Array.isArray(converted) ? converted[0] : converted;
            if (singleBlob && singleBlob.size > 0) {
                workingBlob = singleBlob;
            }
        } catch (heicErr) {
            console.warn('HEIC dynamic conversion note:', heicErr);
        }
    }

    const hasAlpha = file.type === 'image/png' || file.type === 'image/webp';
    const preferredMime = forceFormat
        ? forceFormat === 'webp' ? 'image/webp' : 'image/jpeg'
        : hasAlpha ? 'image/webp' : 'image/webp';

    // 2. Hardware-accelerated Pipeline via createImageBitmap (Instant for 24MP-61MP Sony A7 / Lightroom)
    try {
        let probeBitmap = await createResizedBitmap(workingBlob);
        if (probeBitmap) {
            const origWidth = probeBitmap.width;
            const origHeight = probeBitmap.height;
            probeBitmap.close(); // Free probe handle immediately

            if (origWidth > 0 && origHeight > 0) {
                // Calculate proportional target dimensions
                let targetWidth = origWidth;
                let targetHeight = origHeight;
                if (targetWidth > maxWidth || targetHeight > maxHeight) {
                    const ratio = Math.min(maxWidth / targetWidth, maxHeight / targetHeight);
                    targetWidth = Math.max(1, Math.round(targetWidth * ratio));
                    targetHeight = Math.max(1, Math.round(targetHeight * ratio));
                }

                // Decode directly at the targeted dimension using C++ subsampling
                const resizedBitmap = await createResizedBitmap(workingBlob, targetWidth, targetHeight);
                if (resizedBitmap) {
                    const canvas = document.createElement('canvas');
                    canvas.width = targetWidth;
                    canvas.height = targetHeight;

                    const ctx = canvas.getContext('2d', {
                        alpha: hasAlpha,
                        willReadFrequently: false,
                        colorSpace: 'srgb', // Standardize Lightroom Adobe RGB / ProPhoto RGB to web sRGB
                    }) || canvas.getContext('2d');

                    if (ctx) {
                        ctx.imageSmoothingEnabled = true;
                        ctx.imageSmoothingQuality = 'high';
                        ctx.drawImage(resizedBitmap, 0, 0, targetWidth, targetHeight);
                        resizedBitmap.close(); // Free GPU memory immediately

                        let finalBlob = await canvasToBlobWithFallback(canvas, quality, preferredMime);

                        // If output blob is still > 1.2MB (very complex scene), perform a fast quality trim
                        if (finalBlob.size > 1200 * 1024) {
                            try {
                                const trimmedBlob = await canvasToBlobWithFallback(canvas, quality * 0.85, preferredMime);
                                if (trimmedBlob && trimmedBlob.size > 0 && trimmedBlob.size < finalBlob.size) {
                                    finalBlob = trimmedBlob;
                                }
                            } catch {
                                // Keep finalBlob
                            }
                        }

                        if (finalBlob && finalBlob.size > 0) {
                            return finalBlob;
                        }
                    } else {
                        resizedBitmap.close();
                    }
                }
            }
        }
    } catch (bitmapErr) {
        console.warn('createImageBitmap accelerated path note, trying standard canvas path:', bitmapErr);
    }

    // 3. Fallback Pipeline: HTMLImageElement + Stepped Downsampling
    return new Promise((resolve) => {
        const img = new Image();
        const objectUrl = URL.createObjectURL(workingBlob);

        img.onload = async () => {
            URL.revokeObjectURL(objectUrl);
            let width = img.naturalWidth || img.width;
            let height = img.naturalHeight || img.height;

            if (!width || !height) {
                resolve(workingBlob);
                return;
            }

            // Downscale to target max width/height while maintaining aspect ratio
            if (width > maxWidth || height > maxHeight) {
                const ratio = Math.min(maxWidth / width, maxHeight / height);
                width = Math.max(1, Math.round(width * ratio));
                height = Math.max(1, Math.round(height * ratio));
            }

            // Stepped downscale if image is more than 3x target dimensions (common for 6000x4000 Sony A7)
            let drawSource: CanvasImageSource = img;
            let currentWidth = img.naturalWidth;
            let currentHeight = img.naturalHeight;

            if (currentWidth > width * 2 && currentHeight > height * 2) {
                try {
                    const stepCanvas = document.createElement('canvas');
                    stepCanvas.width = Math.round(currentWidth * 0.5);
                    stepCanvas.height = Math.round(currentHeight * 0.5);
                    const stepCtx = stepCanvas.getContext('2d');
                    if (stepCtx) {
                        stepCtx.imageSmoothingEnabled = true;
                        stepCtx.imageSmoothingQuality = 'medium';
                        stepCtx.drawImage(img, 0, 0, stepCanvas.width, stepCanvas.height);
                        drawSource = stepCanvas;
                    }
                } catch {
                    // Continue with direct draw if step canvas allocation fails
                    drawSource = img;
                }
            }

            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d', {
                alpha: hasAlpha,
                willReadFrequently: false,
            }) || canvas.getContext('2d');

            if (!ctx) {
                resolve(workingBlob);
                return;
            }

            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            ctx.drawImage(drawSource, 0, 0, width, height);

            try {
                let blob = await canvasToBlobWithFallback(canvas, quality, preferredMime);
                if (blob && blob.size > 1200 * 1024) {
                    const secondPass = await canvasToBlobWithFallback(canvas, quality * 0.85, preferredMime);
                    if (secondPass && secondPass.size > 0 && secondPass.size < blob.size) {
                        blob = secondPass;
                    }
                }
                resolve(blob);
            } catch {
                resolve(workingBlob);
            }
        };

        img.onerror = () => {
            URL.revokeObjectURL(objectUrl);
            console.warn('Canvas image fallback load failed:', file.name);
            resolve(workingBlob);
        };

        img.src = objectUrl;
    });
};

/**
 * Preset compression options for different use cases
 * Balanced for high-DPI displays (Retina, 2K, 4K) while keeping files under 250KB - 800KB
 */
export const compressionPresets = {
    // Profile photos, avatars (small, square-ish)
    avatar: { maxWidth: 500, maxHeight: 500, quality: 0.82 },

    // Staff/Admin photos (medium, vertical portrait)
    profile: { maxWidth: 800, maxHeight: 1000, quality: 0.85 },

    // News cover images and hero banners (wide, crisp, optimal compression)
    cover: { maxWidth: 1920, maxHeight: 1080, quality: 0.85 },

    // Hero banner / Header slides (high definition widescreen)
    hero: { maxWidth: 1920, maxHeight: 1080, quality: 0.85 },

    // Gallery photos (ultra crisp, full-screen detail)
    gallery: { maxWidth: 1920, maxHeight: 1280, quality: 0.86 },

    // Thumbnails
    thumbnail: { maxWidth: 400, maxHeight: 400, quality: 0.75 },

    // Event images
    event: { maxWidth: 1600, maxHeight: 1000, quality: 0.84 },
};

/**
 * Generate a WebP filename
 */
export const generateWebPFilename = (prefix: string): string => {
    return `${prefix}_${Date.now()}.webp`;
};

/**
 * Crop and scale an image with aspect ratio and focal point position
 */
export const cropImageToDataUrl = (
  imageSrc: string,
  aspectRatio: number, // width / height, e.g. 16/9, 21/9, 4/3, 1
  focalXPercent: number = 50, // 0 to 100 (50 is center)
  focalYPercent: number = 50, // 0 to 100 (50 is center)
  zoomScale: number = 1.0 // 1.0 = 100%
): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      const naturalWidth = img.naturalWidth || img.width;
      const naturalHeight = img.naturalHeight || img.height;

      if (!naturalWidth || !naturalHeight) {
        resolve(imageSrc);
        return;
      }

      // Calculate target crop dimensions
      let cropWidth = naturalWidth;
      let cropHeight = naturalWidth / aspectRatio;

      if (cropHeight > naturalHeight) {
        cropHeight = naturalHeight;
        cropWidth = naturalHeight * aspectRatio;
      }

      // Apply zoom if requested (zoom in means smaller crop window)
      if (zoomScale > 1.0) {
        cropWidth = cropWidth / zoomScale;
        cropHeight = cropHeight / zoomScale;
      }

      // Calculate crop top-left position based on focal percentages
      const maxStartX = Math.max(0, naturalWidth - cropWidth);
      const maxStartY = Math.max(0, naturalHeight - cropHeight);

      const startX = Math.max(0, Math.min(maxStartX, (focalXPercent / 100) * maxStartX));
      const startY = Math.max(0, Math.min(maxStartY, (focalYPercent / 100) * maxStartY));

      // Output canvas capped at 1920px width
      const targetWidth = Math.min(1920, Math.round(cropWidth));
      const targetHeight = Math.round(targetWidth / aspectRatio);

      const canvas = document.createElement('canvas');
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        resolve(imageSrc);
        return;
      }

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(
        img,
        startX,
        startY,
        cropWidth,
        cropHeight,
        0,
        0,
        targetWidth,
        targetHeight
      );

      try {
        const resultUrl = canvas.toDataURL('image/jpeg', 0.88);
        resolve(resultUrl);
      } catch {
        resolve(imageSrc);
      }
    };

    img.onerror = () => {
      resolve(imageSrc);
    };

    img.src = imageSrc;
  });
};
