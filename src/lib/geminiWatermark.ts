/**
 * Gemini Watermark Remover Engine (100% Client-Side, $0 Cost Forever)
 * Based on GargantuaX/gemini-watermark-remover & @pilio/gemini-watermark-remover
 * Uses mathematically precise Reverse Alpha Blending for lossless removal of Gemini AI watermarks.
 */

import { removeWatermarkFromImage, createWatermarkEngine } from '@pilio/gemini-watermark-remover/browser';
import { loadImage } from './clientImage';

export interface GeminiRemovalResult {
  blob: Blob;
  dataUrl: string;
  meta?: any;
  width: number;
  height: number;
}

let cachedEngine: any = null;

/**
 * Gets or initializes the Gemini watermark removal engine
 */
export async function getGeminiWatermarkEngine() {
  if (!cachedEngine) {
    cachedEngine = await createWatermarkEngine();
  }
  return cachedEngine;
}

/**
 * Removes the Gemini watermark from an image file, blob, or HTMLImageElement
 */
export async function removeGeminiWatermarkFromImage(
  source: File | Blob | string | HTMLImageElement,
  options: {
    alphaGain?: number;
    forceVariant?: string;
  } = {}
): Promise<GeminiRemovalResult> {
  const img = source instanceof HTMLImageElement ? source : await loadImage(source);
  const engine = await getGeminiWatermarkEngine();

  const { canvas, meta } = await removeWatermarkFromImage(img, {
    engine,
    ...options,
  });

  let htmlCanvas: HTMLCanvasElement;
  if (typeof HTMLCanvasElement !== 'undefined' && canvas instanceof HTMLCanvasElement) {
    htmlCanvas = canvas;
  } else {
    htmlCanvas = document.createElement('canvas');
    htmlCanvas.width = canvas.width;
    htmlCanvas.height = canvas.height;
    const ctx = htmlCanvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(canvas as any, 0, 0);
    }
  }

  const blob: Blob = await new Promise((resolve, reject) => {
    htmlCanvas.toBlob(
      (b) => {
        if (b) resolve(b);
        else reject(new Error('Failed to generate clean image blob from canvas'));
      },
      'image/png'
    );
  });

  const dataUrl = htmlCanvas.toDataURL('image/png');

  return {
    blob,
    dataUrl,
    meta,
    width: htmlCanvas.width,
    height: htmlCanvas.height,
  };
}
