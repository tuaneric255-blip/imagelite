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
 * SMART OPTIMIZER (MOBILE-FIRST STRATEGY)
 */
const smartOptimizedCompress = async (file: File, targetType: string): Promise<Blob> => {
    const isAVIF = targetType === 'image/avif';
    
    const { width, height } = await getImageDimensions(file);
    const maxDimension = Math.max(width, height);
    const sizeInMB = file.size / (1024 * 1024);
    
    // DETECT MOBILE PHOTO: High Res (>2000px) + Low Size (<2.5MB)
    // iPhone HEIC/JPGs are highly optimized.
    const isMobilePhoto = maxDimension > 2000 && sizeInMB < 2.5;

    let startWidth = 1920;
    // Lower default quality for WebP/AVIF to combat bloat
    let startQuality = isAVIF ? 0.5 : 0.65; 

    if (isMobilePhoto) {
        console.warn('Mobile Photo Detected. Engaging Pre-emptive Optimization.');
        startWidth = 1280; // HD Ready
        startQuality = isAVIF ? 0.35 : 0.5;
    }

    // --- PASS 1 ---
    let blob = await compressImage(file, { 
        quality: startQuality, 
        type: targetType, 
        maxWidth: startWidth 
    });

    // CRITICAL FIX: Check if Browser Failed to Encode WebP/AVIF
    // If we asked for WebP but got PNG, the browser doesn't support writing WebP.
    // PNG will be HUGE. We must fallback to JPEG to save space.
    if ((targetType === 'image/webp' || targetType === 'image/avif') && blob.type === 'image/png') {
        console.warn(`${targetType} not supported (got PNG). Fallback to JPEG to prevent bloating.`);
        // Force conversion to JPEG
        blob = await compressImage(file, {
            quality: 0.7,
            type: 'image/jpeg',
            maxWidth: startWidth
        });
    }

    // --- PASS 2: Check & React ---
    if (blob.size >= file.size) {
        console.warn(`Pass 1 bloated (${formatBytes(blob.size)}). Engaging Emergency Mode.`);

        const pass2Width = 1024;
        const pass2Quality = blob.type === 'image/avif' ? 0.25 : 0.4;

        // Ensure we stick to the format of 'blob' (which might be JPEG now if fallback occurred)
        const retryType = blob.type; 

        const retryBlob = await compressImage(file, { 
            quality: pass2Quality, 
            type: retryType, 
            maxWidth: pass2Width 
        });

        if (retryBlob.size < blob.size) {
            blob = retryBlob;
        }
        
        // --- PASS 3: Nuclear ---
        // If Pass 2 is STILL bigger or barely smaller
        if (blob.size >= file.size * 0.9) {
             console.warn(`Pass 2 (${pass2Width}px) still heavy. Nuke it.`);
             const pass3Blob = await compressImage(file, {
                 quality: 0.3,
                 type: retryType,
                 maxWidth: 800
             });
             
             if (pass3Blob.size < blob.size) {
                 blob = pass3Blob;
             }
        }
    }

    // Final Decision:
    // If we are just compressing (Same Format) and result is bigger -> Return Original
    if (file.type === blob.type && blob.size >= file.size) {
        return file;
    }

    // If we converted (JPG -> WebP/JPG-Fallback), return the result even if slightly larger
    // (though our logic tries hard to avoid this).
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