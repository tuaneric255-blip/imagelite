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
  maxWidth?: number; // Added smart resizing capability
}

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
      // If maxWidth is provided, ensure dimensions don't exceed it.
      // This is crucial for mobile photos (4000px+) which cause bloating.
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

      // High quality smoothing for resizing
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, width, height);
      
      const targetType = options.type || file.type || 'image/jpeg';

      canvas.toBlob((blob) => {
        if (blob) {
            // Browser fallback detection
            if (targetType !== 'image/png' && blob.type === 'image/png' && targetType !== blob.type) {
                console.warn(`Browser fell back to PNG from ${targetType}`);
            }
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
 * SMART OPTIMIZER
 * Iteratively attempts to compress the image to ensure it's smaller than the original.
 * Solves the "Mobile Photo Bloat" issue.
 */
const smartOptimizedCompress = async (file: File, targetType: string): Promise<Blob> => {
    const isAVIF = targetType === 'image/avif';
    
    // PASS 1: Standard Web Optimization
    // Resize to Full HD (1920px) max.
    // Quality: AVIF 0.4 / WebP 0.65
    const pass1Quality = isAVIF ? 0.4 : 0.65;
    
    let blob = await compressImage(file, { 
        quality: pass1Quality, 
        type: targetType, 
        maxWidth: 1920 
    });

    // CHECK: Did we bloat? Or is the reduction insignificant (< 10%)?
    // Mobile photos often bloat here because 1920px canvas > hardware compressed original.
    const isLarger = blob.size >= file.size;
    const isInefficient = blob.size > (file.size * 0.9); // Less than 10% saving

    if (isLarger || isInefficient) {
        // PASS 2: Aggressive Optimization (The "Mobile Fix")
        // Resize to 1280px (HD Ready) - sufficiently sharp for web, drastically reduces pixel count.
        // Quality: AVIF 0.25 / WebP 0.5
        console.warn(`Pass 1 inefficient (${formatBytes(blob.size)}). Applying aggressive optimization.`);
        
        const pass2Quality = isAVIF ? 0.25 : 0.5;
        const retryBlob = await compressImage(file, { 
            quality: pass2Quality, 
            type: targetType, 
            maxWidth: 1280 
        });

        // Use retry if it's smaller than the first pass
        if (retryBlob.size < blob.size) {
            blob = retryBlob;
        }
    }

    // FINAL DECISION LOGIC:
    
    // Scenario A: Same Format (e.g., Compress JPG -> JPG)
    // Rule: NEVER return a larger file.
    if (file.type === targetType && blob.size >= file.size) {
        console.warn('Optimization failed to reduce size. Returning original.');
        return file;
    }

    // Scenario B: Convert Format (e.g., JPG -> WebP)
    // Rule: Return the smallest result we managed to generate. 
    // Even if it's slightly larger than original (rare with Pass 2), 
    // the user requested a format change, so we must return that format.
    // However, Pass 2 (1280px) almost guarantees smaller size for mobile photos.
    
    return blob;
};

export const convertToWebP = async (file: File): Promise<Blob> => {
  return smartOptimizedCompress(file, 'image/webp');
};

export const convertToAVIF = async (file: File): Promise<Blob> => {
  try {
    const blob = await smartOptimizedCompress(file, 'image/avif');
    // Fallback if browser doesn't support AVIF writing (returns PNG)
    if (blob.type === 'image/png') {
        console.warn('AVIF encoding not supported by browser, falling back to WebP');
        return convertToWebP(file);
    }
    return blob;
  } catch (e) {
    return convertToWebP(file);
  }
};

// General compress tool
export const compressSimple = async (file: File): Promise<Blob> => {
    return smartOptimizedCompress(file, file.type); // Keep original format
};