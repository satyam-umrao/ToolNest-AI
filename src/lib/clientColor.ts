/**
 * Client-Side Color Engine (100% Client-Side, $0 Cost Forever)
 * Uses EyeDropper API, HTML5 Canvas pixel sampling, and color quantization algorithms.
 */

export interface ColorData {
  hex: string;
  rgb: { r: number; g: number; b: number };
  hsl: { h: number; s: number; l: number };
  cmyk: { c: number; m: number; y: number; k: number };
  name?: string;
}

/**
 * Checks if the browser supports the native EyeDropper API
 */
export function isEyeDropperSupported(): boolean {
  return typeof window !== 'undefined' && 'EyeDropper' in window;
}

/**
 * Opens the native browser EyeDropper to pick any pixel from the screen
 */
export async function openNativeEyeDropper(): Promise<ColorData | null> {
  if (!isEyeDropperSupported()) {
    throw new Error('EyeDropper API is not supported in this browser. Please click directly on the image preview.');
  }

  try {
    const EyeDropperClass = (window as any).EyeDropper;
    const dropper = new EyeDropperClass();
    const result = await dropper.open();
    return parseColorFromHex(result.sRGBHex);
  } catch (err: any) {
    if (err.name === 'AbortError') return null; // user cancelled
    throw err;
  }
}

/**
 * Reads RGB directly from an HTML canvas at coordinates (x, y)
 */
export function pickColorFromCanvas(
  canvas: HTMLCanvasElement,
  x: number,
  y: number
): ColorData {
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('Cannot get canvas context');

  const boundedX = Math.max(0, Math.min(canvas.width - 1, Math.round(x)));
  const boundedY = Math.max(0, Math.min(canvas.height - 1, Math.round(y)));

  const pixel = ctx.getImageData(boundedX, boundedY, 1, 1).data;
  return buildColorData(pixel[0], pixel[1], pixel[2]);
}

/**
 * Extracts dominant color palette (e.g. 6 to 10 colors) directly in browser using color quantization
 */
export async function extractDominantPalette(
  imageSource: string | File,
  colorCount: number = 8
): Promise<ColorData[]> {
  const img = await loadImageElement(imageSource);
  const canvas = document.createElement('canvas');

  // Downsample image for high performance quantization
  const maxDim = 150;
  const scale = Math.min(maxDim / img.naturalWidth, maxDim / img.naturalHeight, 1);
  canvas.width = Math.max(1, Math.round(img.naturalWidth * scale));
  canvas.height = Math.max(1, Math.round(img.naturalHeight * scale));

  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('Canvas context not available');

  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;

  // Collect pixel samples (skip transparent or near-transparent pixels)
  const pixels: [number, number, number][] = [];
  for (let i = 0; i < imgData.length; i += 16) {
    const a = imgData[i + 3];
    if (a > 128) {
      pixels.push([imgData[i], imgData[i + 1], imgData[i + 2]]);
    }
  }

  if (pixels.length === 0) {
    return [buildColorData(0, 0, 0)];
  }

  // Simple k-means clustering in browser memory
  const centroids = kMeansColors(pixels, Math.min(colorCount, pixels.length), 8);
  return centroids.map(([r, g, b]) => buildColorData(r, g, b));
}

/**
 * Helper to build ColorData object with HEX, RGB, HSL, CMYK
 */
export function buildColorData(r: number, g: number, b: number): ColorData {
  const hex = rgbToHex(r, g, b);
  const hsl = rgbToHsl(r, g, b);
  const cmyk = rgbToCmyk(r, g, b);
  return { hex, rgb: { r, g, b }, hsl, cmyk };
}

export function parseColorFromHex(hex: string): ColorData {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.substring(0, 2), 16) || 0;
  const g = parseInt(clean.substring(2, 4), 16) || 0;
  const b = parseInt(clean.substring(4, 6), 16) || 0;
  return buildColorData(r, g, b);
}

function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map((x) => Math.round(x).toString(16).padStart(2, '0')).join('');
}

function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  r /= 255;
  g /= 255;
  b /= 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

function rgbToCmyk(r: number, g: number, b: number): { c: number; m: number; y: number; k: number } {
  const rN = r / 255;
  const gN = g / 255;
  const bN = b / 255;

  const k = 1 - Math.max(rN, gN, bN);
  if (k === 1) {
    return { c: 0, m: 0, y: 0, k: 100 };
  }

  const c = Math.round(((1 - rN - k) / (1 - k)) * 100);
  const m = Math.round(((1 - gN - k) / (1 - k)) * 100);
  const y = Math.round(((1 - bN - k) / (1 - k)) * 100);

  return { c, m, y, k: Math.round(k * 100) };
}

/**
 * Basic K-means color clustering algorithm
 */
function kMeansColors(
  pixels: [number, number, number][],
  k: number,
  iterations: number = 6
): [number, number, number][] {
  // Initialize centroids with spread samples
  const step = Math.floor(pixels.length / k);
  let centroids: [number, number, number][] = [];
  for (let i = 0; i < k; i++) {
    centroids.push([...pixels[i * step || 0]]);
  }

  for (let iter = 0; iter < iterations; iter++) {
    const clusters: [number, number, number][][] = Array.from({ length: k }, () => []);

    // Assign pixels to closest centroid
    for (const p of pixels) {
      let minDist = Infinity;
      let clusterIdx = 0;
      for (let c = 0; c < k; c++) {
        const cent = centroids[c];
        const dist =
          Math.pow(p[0] - cent[0], 2) +
          Math.pow(p[1] - cent[1], 2) +
          Math.pow(p[2] - cent[2], 2);
        if (dist < minDist) {
          minDist = dist;
          clusterIdx = c;
        }
      }
      clusters[clusterIdx].push(p);
    }

    // Recompute centroids
    centroids = clusters.map((cluster, idx) => {
      if (cluster.length === 0) return centroids[idx];
      const sum = cluster.reduce(
        (acc, val) => [acc[0] + val[0], acc[1] + val[1], acc[2] + val[2]],
        [0, 0, 0]
      );
      return [
        Math.round(sum[0] / cluster.length),
        Math.round(sum[1] / cluster.length),
        Math.round(sum[2] / cluster.length),
      ];
    });
  }

  // Remove duplicate or near-identical centroids
  const uniqueCentroids: [number, number, number][] = [];
  for (const c of centroids) {
    const exists = uniqueCentroids.some(
      (u) =>
        Math.abs(u[0] - c[0]) < 15 &&
        Math.abs(u[1] - c[1]) < 15 &&
        Math.abs(u[2] - c[2]) < 15
    );
    if (!exists) {
      uniqueCentroids.push(c);
    }
  }

  return uniqueCentroids.length > 0 ? uniqueCentroids : centroids;
}

function loadImageElement(source: string | File | Blob): Promise<HTMLImageElement> {
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
      reject(new Error('Failed to load image: ' + err));
    };
    img.src = url;
  });
}
