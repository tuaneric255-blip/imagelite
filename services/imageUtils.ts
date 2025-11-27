/**
 * Utility functions for client-side image processing
 * mimicking server-side behavior for demo purposes.
 * Includes SMART RESIZING to prevent mobile photo bloating.
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

interface CompressOptions {
  quality: number;
  type: string;
  maxWidth?: number;
}

/**
 * Helper: Convert DataURI to Blob
 */
const dataURItoBlob = (dataURI: string): Blob => {
  const byteString = atob(dataURI.split(',')[1]);
  const mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];
  const ab = new ArrayBuffer(byteString.length);
  const ia = new Uint8Array(ab);
  for (let i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i);
  }
  return new Blob([ab], { type: mimeString });
};

/**
 * Helper to get image dimensions
 */
const getImageDimensions = (file: File): Promise<{width: number, height: number}> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.width, height: img.height });
    img.onerror = () => resolve({ width: 0, height: 0 });
    img.src = URL.createObjectURL(file);
  });
};

/**
 * Core image compression with Resizing support
 */
export const compressImage = async (file: File, options: CompressOptions): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const reader = new FileReader();
    
    reader.onload = (e) => {
      img.src = e.target?.result as string;
    };
    
    img.onload = () => {
      let width = img.width;
      let height = img.height;

      // SMART RESIZING LOGIC
      const MAX_WIDTH = options.maxWidth || 0;
      if (MAX_WIDTH > 0 && (width > MAX_WIDTH || height > MAX_WIDTH)) {
        if (width > height) {
          height = Math.round(height * (MAX_WIDTH / width));
          width = MAX_WIDTH;
        } else {
          width = Math.round(width * (MAX_WIDTH / height));
          height = MAX_WIDTH;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas context unavailable'));
        return;
      }

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, width, height);
      
      const targetType = options.type || file.type || 'image/jpeg';

      // MOBILE FIX: Use toDataURL for WebP/AVIF first
      // Some mobile browsers handle toDataURL('image/webp') better than toBlob
      if (targetType === 'image/webp' || targetType === 'image/avif') {
          const dataUrl = canvas.toDataURL(targetType, options.quality);
          // Check if browser supported it or fell back to png
          if (dataUrl.startsWith('data:' + targetType)) {
              resolve(dataURItoBlob(dataUrl));
              return;
          }
          // If fallback happened (e.g. data:image/png), we continue to standard blob 
          // but we will catch the type mismatch later.
      }

      canvas.toBlob((blob) => {
        if (blob) {
            resolve(blob);
        } else {
            reject(new Error('Compression failed'));
        }
      }, targetType, options.quality);
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

/**
 * SMART OPTIMIZER (MOBILE-FIRST STRATEGY - TARGET < 100KB)
 * Version 2.1: Aggressive downscaling to hit ~100KB target for mobile
 */
const smartOptimizedCompress = async (file: File, targetType: string): Promise<Blob> => {
    const isAVIF = targetType === 'image/avif';
    
    const { width, height } = await getImageDimensions(file);
    const maxDimension = Math.max(width, height);
    const sizeInMB = file.size / (1024 * 1024);
    
    // DETECT MOBILE PHOTO: High Res (>2000px) + Low Size (<2.5MB)
    // iPhone HEIC/JPGs are highly optimized.
    const isMobilePhoto = maxDimension > 2000 && sizeInMB < 3.0;

    let startWidth = 1920;
    // Lower default quality for WebP/AVIF to combat bloat
    let startQuality = isAVIF ? 0.5 : 0.65; 

    if (isMobilePhoto) {
        console.warn('Mobile Photo Detected (v2.1). Engaging Target < 100KB Strategy.');
        // Start closer to HD Ready to save processing time and bytes
        startWidth = 1280; 
        startQuality = isAVIF ? 0.4 : 0.6;
    }

    // --- PASS 1: Initial Attempt ---
    let blob = await compressImage(file, { 
        quality: startQuality, 
        type: targetType, 
        maxWidth: startWidth 
    });

    // CRITICAL FIX: TRAP PNG FALLBACK
    // If we asked for WebP/AVIF but got PNG, the browser is unsupported.
    if ((targetType === 'image/webp' || targetType === 'image/avif') && blob.type === 'image/png') {
        console.warn(`${targetType} not supported (got PNG). Force Fallback to JPEG.`);
        
        // Fallback Strategy: JPEG at 1024px.
        // We go smaller (1024px) because JPEG needs to compete with WebP size.
        blob = await compressImage(file, {
            quality: 0.7,
            type: 'image/jpeg',
            maxWidth: 1024 
        });
    }

    // --- PASS 2: Size Check (Target ~150KB Buffer) ---
    // If output is > 150KB, we need to be more aggressive to approach 100KB
    if (blob.size > 150 * 1024 || (isMobilePhoto && blob.size > file.size)) {
        console.warn(`Pass 1 result: ${formatBytes(blob.size)}. Too big. Engaging Downscale to 960px.`);

        const pass2Width = 960; // Mobile HD Portrait width
        const pass2Quality = blob.type === 'image/avif' ? 0.3 : 0.5; // Slightly lower quality
        const retryType = blob.type; // Stick to the resolved type (JPEG or WebP)

        const retryBlob = await compressImage(file, { 
            quality: pass2Quality, 
            type: retryType, 
            maxWidth: pass2Width 
        });

        if (retryBlob.size < blob.size) {
            blob = retryBlob;
        }
        
        // --- PASS 3: Nuclear Option (Target < 100KB) ---
        // If Pass 2 is still > 100KB, drop to 800px.
        // 800px is still very usable for mobile/social/blog inline images.
        if (blob.size > 100 * 1024) {
             console.warn(`Pass 2 result: ${formatBytes(blob.size)}. Still > 100KB. Engaging 800px Limit.`);
             const pass3Blob = await compressImage(file, {
                 quality: blob.type === 'image/avif' ? 0.25 : 0.45,
                 type: retryType,
                 maxWidth: 800
             });
             
             // Only use if smaller
             if (pass3Blob.size < blob.size) {
                 blob = pass3Blob;
             }
        }
    }

    // FINAL DECISION LOGIC:
    // If we are just compressing (Same Format) and result is bigger -> Return Original
    if (file.type === blob.type && blob.size >= file.size) {
        return file;
    }

    return blob;
};

export const convertToWebP = async (file: File): Promise<Blob> => {
  return smartOptimizedCompress(file, 'image/webp');
};

export const convertToAVIF = async (file: File): Promise<Blob> => {
  return smartOptimizedCompress(file, 'image/avif');
};

// General compress tool
export const compressSimple = async (file: File): Promise<Blob> => {
    return smartOptimizedCompress(file, file.type); 
};

// SVG Generator
export const generateSVGWrapper = async (file: File): Promise<string> => {
    if (file.type === 'image/svg+xml') {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsText(file);
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
        });
    }

    const optimizedBlob = await smartOptimizedCompress(file, file.type);
    const base64 = await fileToBase64(new File([optimizedBlob], file.name, { type: file.type }));
    
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
            const svg = `<!-- Generated by ImageLite Studio -->
<svg width="${img.width}" height="${img.height}" viewBox="0 0 ${img.width} ${img.height}" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
  <image width="${img.width}" height="${img.height}" xlink:href="${base64}" />
</svg>`;
            resolve(svg);
        };
        img.src = base64;
    });
};