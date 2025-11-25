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
      
      // Basic check: if attempting to compress PNG with 'image/png', quality is ignored by canvas.
      // To actually compress, we default to JPEG if type is not specified or enforce the requested type.
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

// Adjusted to 0.5. AVIF is very efficient, so 0.5 retains high quality while drastically reducing size.
export const convertToAVIF = async (file: File): Promise<Blob> => {
  return compressImage(file, 0.5, 'image/avif');
};