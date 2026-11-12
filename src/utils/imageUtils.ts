/**
 * Image compression utilities for optimizing uploads
 */

export interface CompressOptions {
    maxWidth?: number;
    maxHeight?: number;
    quality?: number;
}

/**
 * Compress an image file before upload
 * @param file - The original image file
 * @param options - Compression options
 * @returns Compressed image as a Blob in WebP format
 */
/**
 * Check if file is HEIC/HEIF or iOS image
 */
export const isHeicFile = (file: File): boolean => {
    const ext = file.name.split('.').pop()?.toLowerCase();
    return (
        file.type === 'image/heic' ||
        file.type === 'image/heif' ||
        ext === 'heic' ||
        ext === 'heif'
    );
};

/**
 * Compress or convert an image file before upload
 * Supports all standard formats plus HEIC/HEIF fallback and no size limit
 * @param file - The original image file
 * @param options - Compression options
 * @returns Compressed image as a Blob in WebP (or original) format
 */
export const compressImage = async (
    file: File,
    options: CompressOptions = {}
): Promise<Blob> => {
    const { maxWidth = 1920, maxHeight = 1080, quality = 0.85 } = options;

    // If SVG or animated GIF, keep original
    if (file.type === 'image/svg+xml' || file.type === 'image/gif') {
        return file;
    }

    let workingFile: Blob = file;

    // 1. Convert HEIC/HEIF images (common from iPhone, iPad, and Mac) to standard JPEG
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
                workingFile = singleBlob;
            }
        } catch (heicErr) {
            console.warn('HEIC dynamic conversion note:', heicErr);
        }
    }

    return new Promise((resolve) => {
        const img = new Image();
        const objectUrl = URL.createObjectURL(workingFile);

        img.onload = () => {
            URL.revokeObjectURL(objectUrl);
            let width = img.naturalWidth || img.width;
            let height = img.naturalHeight || img.height;

            // If dimensions are invalid or 0, fallback
            if (!width || !height) {
                resolve(workingFile);
                return;
            }

            // Downscale to target max width/height while maintaining aspect ratio
            if (width > maxWidth || height > maxHeight) {
                const ratio = Math.min(maxWidth / width, maxHeight / height);
                width = Math.round(width * ratio);
                height = Math.round(height * ratio);
            }

            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d', { willReadFrequently: false });

            if (!ctx) {
                resolve(workingFile);
                return;
            }

            // High-quality rendering
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            ctx.drawImage(img, 0, 0, width, height);

            // Attempt WebP first, fallback to JPEG for Safari / Mac compatibility
            canvas.toBlob(
                (blob) => {
                    if (blob && blob.size > 0) {
                        resolve(blob);
                    } else {
                        // Safari / Mac fallback to image/jpeg
                        canvas.toBlob(
                            (jpegBlob) => {
                                if (jpegBlob && jpegBlob.size > 0) {
                                    resolve(jpegBlob);
                                } else {
                                    // Extreme fallback: canvas data URL to blob
                                    try {
                                        const dataUrl = canvas.toDataURL('image/jpeg', quality);
                                        const byteString = atob(dataUrl.split(',')[1]);
                                        const ab = new ArrayBuffer(byteString.length);
                                        const ia = new Uint8Array(ab);
                                        for (let i = 0; i < byteString.length; i++) {
                                            ia[i] = byteString.charCodeAt(i);
                                        }
                                        resolve(new Blob([ab], { type: 'image/jpeg' }));
                                    } catch {
                                        resolve(workingFile);
                                    }
                                }
                            },
                            'image/jpeg',
                            quality
                        );
                    }
                },
                'image/webp',
                quality
            );
        };

        img.onerror = () => {
            URL.revokeObjectURL(objectUrl);
            console.warn('Canvas image load failed, returning working file:', file.name);
            resolve(workingFile);
        };

        img.src = objectUrl;
    });
};

/**
 * Preset compression options for different use cases
 */
export const compressionPresets = {
    // Profile photos, avatars (small, square-ish)
    avatar: { maxWidth: 400, maxHeight: 400, quality: 0.8 },

    // Staff/Admin photos (medium)
    profile: { maxWidth: 600, maxHeight: 800, quality: 0.8 },

    // News cover images and hero banners (wide, crisp, optimal compression)
    cover: { maxWidth: 1600, maxHeight: 1000, quality: 0.82 },

    // Hero banner / Header slides
    hero: { maxWidth: 1600, maxHeight: 1000, quality: 0.82 },

    // Gallery photos (high quality)
    gallery: { maxWidth: 1600, maxHeight: 1200, quality: 0.85 },

    // Thumbnails
    thumbnail: { maxWidth: 300, maxHeight: 300, quality: 0.7 },

    // Event images
    event: { maxWidth: 1000, maxHeight: 700, quality: 0.8 },
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

      // Output canvas
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
