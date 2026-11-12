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
export const compressImage = (
    file: File,
    options: CompressOptions = {}
): Promise<Blob> => {
    const { maxWidth = 2000, maxHeight = 2000, quality = 0.85 } = options;

    return new Promise((resolve, reject) => {
        // If SVG or GIF with animation, return raw blob directly to preserve quality
        if (file.type === 'image/svg+xml' || file.type === 'image/gif') {
            resolve(file);
            return;
        }

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();

        img.onload = () => {
            let width = img.width;
            let height = img.height;

            // Calculate new dimensions while maintaining aspect ratio
            if (width > maxWidth || height > maxHeight) {
                const ratio = Math.min(maxWidth / width, maxHeight / height);
                width = Math.round(width * ratio);
                height = Math.round(height * ratio);
            }

            canvas.width = width;
            canvas.height = height;
            ctx?.drawImage(img, 0, 0, width, height);

            canvas.toBlob(
                (blob) => {
                    if (blob) {
                        resolve(blob);
                    } else {
                        // Fallback to original file
                        resolve(file);
                    }
                },
                'image/webp',
                quality
            );

            // Cleanup
            URL.revokeObjectURL(img.src);
        };

        img.onerror = () => {
            URL.revokeObjectURL(img.src);
            // If browser failed to render directly (e.g. raw HEIC without native decoder), return file blob as fallback
            console.warn('Image failed canvas decode, using raw file:', file.name);
            resolve(file);
        };

        img.src = URL.createObjectURL(file);
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

    // News cover images (wider)
    cover: { maxWidth: 1200, maxHeight: 800, quality: 0.85 },

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
