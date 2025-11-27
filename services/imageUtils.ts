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
 * Helper to get image dimensions without rendering
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
      // If maxWidth is provided, ensure dimensions don't exceed it.
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
 * SMART OPTIMIZER (MOBILE-FIRST STRATEGY)
 * Detects "Mobile Photos" (High Res + Low Size) and aggressively downscales them
 * BEFORE attempting compression to prevent bloat.
 */
const smartOptimizedCompress = async (file: File, targetType: string): Promise<Blob> => {
    const isAVIF = targetType === 'image/avif';
    const isWebP = targetType === 'image/webp';
    
    // 1. Analyze Input
    const { width, height } = await getImageDimensions(file);
    const maxDimension = Math.max(width, height);
    const sizeInMB = file.size / (1024 * 1024);
    
    // DETECT MOBILE PHOTO SYNDROME:
    // Huge resolution (> 2500px) BUT small file size (< 2.5MB)
    // This implies heavy hardware compression. Converting to Canvas raw pixels will explode size.
    const isMobilePhoto = maxDimension > 2500 && sizeInMB < 2.5;

    let startWidth = 1920;
    let startQuality = isAVIF ? 0.45 : 0.7;

    if (isMobilePhoto) {
        console.warn('Detected Mobile Photo (High Res/Low Size). Engaging Pre-emptive Downscaling.');
        // Skip 1920px. Go straight to HD (1280px) to kill pixel overhead.
        startWidth = 1280; 
        startQuality = isAVIF ? 0.4 : 0.6;
    }

    // --- PASS 1 ---
    let blob = await compressImage(file, { 
        quality: startQuality, 
        type: targetType, 
        maxWidth: startWidth 
    });

    // --- PASS 2: Check & React ---
    // If output is larger than input, or still too inefficient
    if (blob.size >= file.size) {
        console.warn(`Pass 1 (${startWidth}px) bloated: ${formatBytes(blob.size)}. Engaging Emergency Mode.`);

        // Aggressive Drop: 1024px (Good for blog widths)
        const pass2Width = 1024;
        const pass2Quality = isAVIF ? 0.3 : 0.5;

        const retryBlob = await compressImage(file, { 
            quality: pass2Quality, 
            type: targetType, 
            maxWidth: pass2Width 
        });

        if (retryBlob.size < blob.size) {
            blob = retryBlob;
        }
        
        // --- PASS 3: The Nuclear Option ---
        // If Pass 2 is STILL bigger (rare, but possible with tiny heavily compressed source)
        // Drop to 800px.
        if (blob.size >= file.size) {
             console.warn(`Pass 2 (${pass2Width}px) still bloated. Nuke it.`);
             const pass3Blob = await compressImage(file, {
                 quality: isAVIF ? 0.2 : 0.4,
                 type: targetType,
                 maxWidth: 800
             });
             
             if (pass3Blob.size < blob.size) {
                 blob = pass3Blob;
             }
        }
    }

    // FINAL DECISION LOGIC:
    
    // Scenario A: Same Format (e.g., Compress JPG -> JPG)
    // Rule: NEVER return a larger file. Use Original.
    if (file.type === targetType && blob.size >= file.size) {
        console.warn('Optimization failed to reduce size. Returning original file.');
        return file;
    }

    // Scenario B: Convert Format (e.g., JPG -> WebP/AVIF)
    // Rule: Return the smallest blob we generated. 
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