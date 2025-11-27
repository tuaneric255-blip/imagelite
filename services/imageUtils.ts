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
 * SMART OPTIMIZER (CASCADING STRATEGY)
 * Iteratively attempts to compress the image to ensure it's smaller than the original.
 * Solves the "Mobile Photo Bloat" issue (900% size increase).
 */
const smartOptimizedCompress = async (file: File, targetType: string): Promise<Blob> => {
    const isAVIF = targetType === 'image/avif';
    const isWebP = targetType === 'image/webp';
    
    // --- PASS 1: Standard Web Optimization ---
    // Target: Full HD (1920px). This kills most pixel overhead.
    // Quality: Standard for Web.
    const pass1Quality = isAVIF ? 0.4 : (isWebP ? 0.6 : 0.7);
    const pass1Width = 1920;
    
    let blob = await compressImage(file, { 
        quality: pass1Quality, 
        type: targetType, 
        maxWidth: pass1Width 
    });

    // Heuristic: If output is larger OR reduction is pathetic (<10%), we need to be aggressive.
    // Mobile hardware compression is extremely efficient (often < 500KB for 12MP).
    const isLarger = blob.size >= file.size;
    const isInefficient = blob.size > (file.size * 0.9);

    if (isLarger || isInefficient) {
        console.warn(`Pass 1 (1920px) inefficient: ${formatBytes(blob.size)}. Engaging Aggressive Mode.`);

        // --- PASS 2: Aggressive Optimization ---
        // Target: HD Ready (1280px). Still sharp for web content.
        // Quality: Reduced.
        const pass2Quality = isAVIF ? 0.25 : (isWebP ? 0.45 : 0.5);
        const pass2Width = 1280;

        const retryBlob = await compressImage(file, { 
            quality: pass2Quality, 
            type: targetType, 
            maxWidth: pass2Width 
        });

        if (retryBlob.size < blob.size) {
            blob = retryBlob;
        }

        // --- PASS 3: Emergency Optimization (The "Anti-Bloat" Shield) ---
        // If Pass 2 is STILL larger than original (rare, but possible with tiny inputs),
        // we go extremely aggressive just to ensure we don't deliver a larger file.
        if (blob.size > file.size) {
             console.warn(`Pass 2 (1280px) still bloated: ${formatBytes(blob.size)}. Engaging Emergency Mode.`);
             const pass3Quality = isAVIF ? 0.15 : (isWebP ? 0.3 : 0.4);
             const pass3Width = 1024;
             
             const emergencyBlob = await compressImage(file, {
                 quality: pass3Quality,
                 type: targetType,
                 maxWidth: pass3Width
             });
             
             if (emergencyBlob.size < blob.size) {
                 blob = emergencyBlob;
             }
        }
    }

    // FINAL DECISION LOGIC:
    
    // Scenario A: Same Format (e.g., Compress JPG -> JPG)
    // Rule: NEVER return a larger file. Use Original if we failed to compress.
    if (file.type === targetType && blob.size >= file.size) {
        console.warn('Optimization failed to reduce size. Returning original file.');
        return file;
    }

    // Scenario B: Convert Format (e.g., JPG -> WebP/AVIF)
    // Rule: We return the smallest blob we generated. 
    // Even if it is slightly larger than original (unlikely after Pass 3), 
    // the user requested a format change.
    
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

// SVG Generator
export const generateSVGWrapper = async (file: File): Promise<string> => {
    // If it's already an SVG, read it as text
    if (file.type === 'image/svg+xml') {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsText(file);
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
        });
    }

    // If it's a bitmap, wrap it
    // First compress it slightly to ensure the Base64 isn't massive
    const optimizedBlob = await smartOptimizedCompress(file, file.type);
    const base64 = await fileToBase64(new File([optimizedBlob], file.name, { type: file.type }));
    
    // Get dimensions
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