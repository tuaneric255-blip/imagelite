/**
 * Utility functions for client-side image processing
 * mimicking server-side behavior for demo purposes.
 */

export const formatBytes = (bytes: number, decimals = 2) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

export const calculateReduction = (original: number, processed: number) => {
  if (original === 0) return 0;
  return Math.round(((original - processed) / original) * 100);
};

export const compressImage = async (file: File, quality = 0.6, type = 'image/jpeg'): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const reader = new FileReader();
    
    reader.onload = (e) => {
      img.src = e.target?.result as string;
    };
    
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas context unavailable'));
        return;
      }
      ctx.drawImage(img, 0, 0);
      
      const targetType = type || file.type || 'image/jpeg';

      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Compression/Conversion failed - Format may not be supported by this browser'));
      }, targetType, quality);
    };
    
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
};

export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
};

// Adjusted to 0.6 to match high compression expectations (~80-90% reduction)
export const convertToWebP = async (file: File): Promise<Blob> => {
  return compressImage(file, 0.6, 'image/webp');
};

/**
 * Optimized AVIF Conversion
 * - Quality set to 0.3 (Aggressive) because AVIF quality scale is non-linear. 
 *   0.5 is often near-lossless, while 0.3 matches WebP 0.6 in visual quality but smaller size.
 * - Includes fallback check: If browser returns PNG, retry as WebP.
 */
export const convertToAVIF = async (file: File): Promise<Blob> => {
  try {
    // Attempt AVIF compression with aggressive quality
    const blob = await compressImage(file, 0.3, 'image/avif');
    
    // Fallback detection: 
    // If the browser doesn't support writing AVIF, canvas.toBlob often falls back to image/png silently.
    if (blob.type === 'image/png' || blob.type !== 'image/avif') {
        console.warn('Browser does not support native AVIF encoding, falling back to WebP');
        return convertToWebP(file);
    }
    return blob;
  } catch (e) {
    console.error('AVIF conversion error, falling back to WebP', e);
    return convertToWebP(file);
  }
};