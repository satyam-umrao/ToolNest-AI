/**
 * Client-Side Image Processing Engine (100% Client-Side, $0 Cost Forever)
 * Uses HTML5 Canvas, 2D Context, CSS filters, convolution matrices, and Wasm AI.
 */

export interface CropRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface EnhanceFilters {
  brightness: number; // 0 to 2 (1 is default)
  contrast: number;   // 0 to 2 (1 is default)
  saturation: number; // 0 to 2 (1 is default)
  grayscale: number;  // 0 to 1 (0 is default)
  blur: number;       // 0 to 20 px (0 is default)
  sepia: number;      // 0 to 1 (0 is default)
  sharpness: number;  // 0 to 2 (0 is default)
}

/**
 * Loads an image from URL, File, or Blob into an HTMLImageElement
 */
export function loadImage(source: string | File | Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    const isBlobOrFile = typeof source !== 'string';
    const url = isBlobOrFile ? URL.createObjectURL(source) : source;

    img.onload = () => {
      if (isBlobOrFile) URL.revokeObjectURL(url);
      resolve(img);
    };

    img.onerror = (err) => {
      if (isBlobOrFile) URL.revokeObjectURL(url);
      reject(new Error('Failed to load image into memory: ' + err));
    };

    img.src = url;
  });
}

/**
 * Crops an image based on source coordinates and dimensions
 */
export async function cropImageClient(
  source: string | File,
  crop: CropRect,
  format: string = 'image/png',
  quality: number = 0.95
): Promise<Blob> {
  const img = await loadImage(source);
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(crop.width));
  canvas.height = Math.max(1, Math.round(crop.height));

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Failed to get 2D canvas context');

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  ctx.drawImage(
    img,
    crop.x,
    crop.y,
    crop.width,
    crop.height,
    0,
    0,
    canvas.width,
    canvas.height
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Canvas crop export failed'));
      },
      format,
      quality
    );
  });
}

/**
 * Resizes an image to specified width and height
 */
export async function resizeImageClient(
  source: string | File,
  width: number,
  height: number,
  format: string = 'image/png',
  quality: number = 0.95
): Promise<Blob> {
  const img = await loadImage(source);
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(width));
  canvas.height = Math.max(1, Math.round(height));

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Failed to get 2D canvas context');

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Canvas resize export failed'));
      },
      format,
      quality
    );
  });
}

/**
 * Rotates and flips an image without cropping corners
 */
export async function rotateAndFlipImageClient(
  source: string | File,
  degrees: number,
  flipH: boolean = false,
  flipV: boolean = false,
  format: string = 'image/png',
  quality: number = 0.95
): Promise<Blob> {
  const img = await loadImage(source);
  const rad = (degrees * Math.PI) / 180;
  const sin = Math.abs(Math.sin(rad));
  const cos = Math.abs(Math.cos(rad));

  const canvas = document.createElement('canvas');
  canvas.width = Math.round(img.naturalWidth * cos + img.naturalHeight * sin);
  canvas.height = Math.round(img.naturalWidth * sin + img.naturalHeight * cos);

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Failed to get 2D canvas context');

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  // Translate to center, apply rotation and flip, translate back
  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.rotate(rad);
  ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1);
  ctx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Canvas rotate export failed'));
      },
      format,
      quality
    );
  });
}

/**
 * Enhances image with brightness, contrast, saturation, blur, sepia, grayscale, and sharpening
 */
export async function enhanceImageClient(
  source: string | File,
  filters: EnhanceFilters,
  format: string = 'image/png',
  quality: number = 0.95
): Promise<Blob> {
  const img = await loadImage(source);
  const canvas = document.createElement('canvas');
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Failed to get 2D canvas context');

  // Build CSS filter string
  const cssFilter = [
    `brightness(${filters.brightness * 100}%)`,
    `contrast(${filters.contrast * 100}%)`,
    `saturate(${filters.saturation * 100}%)`,
    `grayscale(${filters.grayscale * 100}%)`,
    `sepia(${filters.sepia * 100}%)`,
    filters.blur > 0 ? `blur(${filters.blur}px)` : '',
  ]
    .filter(Boolean)
    .join(' ');

  ctx.filter = cssFilter || 'none';
  ctx.drawImage(img, 0, 0);

  // Apply convolution sharpening if sharpness > 0
  if (filters.sharpness > 0) {
    applySharpeningFilter(ctx, canvas.width, canvas.height, filters.sharpness);
  }

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Canvas enhance export failed'));
      },
      format,
      quality
    );
  });
}

/**
 * Convolution 3x3 filter for client-side sharpening
 */
function applySharpeningFilter(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  amount: number
) {
  const imgData = ctx.getImageData(0, 0, width, height);
  const src = imgData.data;
  const output = ctx.createImageData(width, height);
  const dst = output.data;

  // Kernel weights for sharpening
  const a = -amount;
  const b = 1 + 4 * amount;
  const kernel = [
    0, a, 0,
    a, b, a,
    0, a, 0,
  ];

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      let r = 0, g = 0, bVal = 0;
      for (let ky = -1; ky <= 1; ky++) {
        for (let kx = -1; kx <= 1; kx++) {
          const pixelPos = ((y + ky) * width + (x + kx)) * 4;
          const weight = kernel[(ky + 1) * 3 + (kx + 1)];
          r += src[pixelPos] * weight;
          g += src[pixelPos + 1] * weight;
          bVal += src[pixelPos + 2] * weight;
        }
      }
      const dstPos = (y * width + x) * 4;
      dst[dstPos] = Math.min(255, Math.max(0, r));
      dst[dstPos + 1] = Math.min(255, Math.max(0, g));
      dst[dstPos + 2] = Math.min(255, Math.max(0, bVal));
      dst[dstPos + 3] = src[dstPos + 3]; // preserve alpha
    }
  }

  ctx.putImageData(output, 0, 0);
}

/**
 * Removes background 100% client-side using in-browser AI
 */
export async function removeBackgroundClient(
  file: File,
  onProgress?: (progress: number, message: string) => void
): Promise<Blob> {
  if (onProgress) onProgress(10, 'Loading AI model in browser...');

  try {
    // Dynamic runtime loader so TypeScript/Webpack compiler doesn't complain about external URL
    const importDynamic = new Function('url', 'return import(url)');
    const imgly = await importDynamic(
      'https://cdn.jsdelivr.net/npm/@imgly/background-removal@1.5.8/+esm'
    );
    const removeBackground = imgly.removeBackground || imgly.default;

    if (!removeBackground) {
      throw new Error('removeBackground function not available from module');
    }

    const blobResult = await removeBackground(file, {
      progress: (key: string, current: number, total: number) => {
        if (total > 0) {
          const pct = Math.round((current / total) * 100);
          if (onProgress) {
            onProgress(
              Math.min(95, Math.max(10, pct)),
              `Processing AI segment (${key}): ${pct}%`
            );
          }
        }
      },
    });

    if (onProgress) onProgress(100, 'Background removed successfully!');
    return blobResult;
  } catch (err: any) {
    console.warn('Wasm AI background removal fallback to smart edge analyzer:', err);
    // Fallback: smart chroma / edge transparency client-side
    return await fallbackRemoveBackground(file, onProgress);
  }
}

/**
 * Fast client-side fallback background removal via smart edge/corner sampling
 */
async function fallbackRemoveBackground(
  file: File,
  onProgress?: (progress: number, message: string) => void
): Promise<Blob> {
  if (onProgress) onProgress(40, 'Analyzing image pixels client-side...');
  const img = await loadImage(file);
  const canvas = document.createElement('canvas');
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas context not available');

  ctx.drawImage(img, 0, 0);
  const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imgData.data;

  // Sample corner pixels to estimate background color
  const sampleR = (data[0] + data[(canvas.width - 1) * 4] + data[(canvas.height - 1) * canvas.width * 4]) / 3;
  const sampleG = (data[1] + data[(canvas.width - 1) * 4 + 1] + data[(canvas.height - 1) * canvas.width * 4 + 1]) / 3;
  const sampleB = (data[2] + data[(canvas.width - 1) * 4 + 2] + data[(canvas.height - 1) * canvas.width * 4 + 2]) / 3;

  const threshold = 38;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    const dist = Math.sqrt(
      Math.pow(r - sampleR, 2) +
      Math.pow(g - sampleG, 2) +
      Math.pow(b - sampleB, 2)
    );

    if (dist < threshold) {
      data[i + 3] = 0; // Transparent
    } else if (dist < threshold + 15) {
      data[i + 3] = Math.round(((dist - threshold) / 15) * 255); // Smooth edge
    }
  }

  ctx.putImageData(imgData, 0, 0);

  if (onProgress) onProgress(100, 'Processing complete!');
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('Canvas export failed'));
    }, 'image/png');
  });
}
