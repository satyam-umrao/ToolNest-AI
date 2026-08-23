import { PDFDocument, rgb, StandardFonts, PDFName } from 'pdf-lib';

/**
 * Removes watermarks, annotations, and draft stamps from a PDF 100% client-side
 */
export async function removePdfWatermarks(
  file: File,
  options: {
    cleanAnnotations?: boolean;
    cleanHeaderFooter?: boolean;
    headerHeight?: number;
    footerHeight?: number;
  } = { cleanAnnotations: true, cleanHeaderFooter: false },
  onProgress?: (progress: number) => void
): Promise<Uint8Array> {
  if (onProgress) onProgress(20);
  const arrayBuffer = await file.arrayBuffer();
  const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
  const totalPages = pdfDoc.getPageCount();

  for (let i = 0; i < totalPages; i++) {
    const page = pdfDoc.getPage(i);

    // 1. Remove annotation layer watermarks & stamps
    if (options.cleanAnnotations !== false) {
      try {
        page.node.delete(PDFName.of('Annots'));
      } catch (e) {
        // ignore if not present
      }
    }

    // 2. Clean header/footer watermarks if selected
    if (options.cleanHeaderFooter) {
      const { width, height } = page.getSize();
      const hHeight = options.headerHeight || 45;
      const fHeight = options.footerHeight || 45;

      if (hHeight > 0) {
        page.drawRectangle({
          x: 0,
          y: height - hHeight,
          width: width,
          height: hHeight,
          color: rgb(1, 1, 1),
        });
      }

      if (fHeight > 0) {
        page.drawRectangle({
          x: 0,
          y: 0,
          width: width,
          height: fHeight,
          color: rgb(1, 1, 1),
        });
      }
    }

    if (onProgress) {
      onProgress(20 + Math.round(((i + 1) / totalPages) * 70));
    }
  }

  const pdfBytes = await pdfDoc.save();
  if (onProgress) onProgress(100);
  return pdfBytes;
}

/**
 * Parses user input page ranges like "1-3, 5, 8-10" into 0-indexed page numbers.
 */
export function parsePageRanges(rangesStr: string, totalPages: number): number[] {
  const pageIndices: Set<number> = new Set();
  const parts = rangesStr.split(',').map((p) => p.trim()).filter(Boolean);

  for (const part of parts) {
    if (part.includes('-')) {
      const [startStr, endStr] = part.split('-').map((s) => s.trim());
      const start = parseInt(startStr, 10);
      const end = parseInt(endStr, 10);

      if (!isNaN(start) && !isNaN(end)) {
        const min = Math.max(1, Math.min(start, end));
        const max = Math.min(totalPages, Math.max(start, end));
        for (let i = min; i <= max; i++) {
          pageIndices.add(i - 1); // 0-indexed
        }
      }
    } else {
      const page = parseInt(part, 10);
      if (!isNaN(page) && page >= 1 && page <= totalPages) {
        pageIndices.add(page - 1); // 0-indexed
      }
    }
  }

  return Array.from(pageIndices).sort((a, b) => a - b);
}

/**
 * Gets page count of a PDF file directly in the browser
 */
export async function getPdfPageCount(file: File): Promise<number> {
  const arrayBuffer = await file.arrayBuffer();
  const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
  return pdfDoc.getPageCount();
}

/**
 * Merges multiple PDF files into one single PDF in browser memory
 */
export async function mergePdfs(
  files: File[],
  onProgress?: (progress: number) => void
): Promise<Uint8Array> {
  const mergedPdf = await PDFDocument.create();

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const arrayBuffer = await file.arrayBuffer();
    const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
    const copiedPages = await mergedPdf.copyPages(pdfDoc, pdfDoc.getPageIndices());
    copiedPages.forEach((page) => mergedPdf.addPage(page));

    if (onProgress) {
      onProgress(Math.round(((i + 1) / files.length) * 100));
    }
  }

  return await mergedPdf.save();
}

/**
 * Extracts specified page ranges from a PDF and returns a new PDF
 */
export async function splitPdf(
  file: File,
  pageRanges: string,
  onProgress?: (progress: number) => void
): Promise<Uint8Array> {
  if (onProgress) onProgress(20);
  const arrayBuffer = await file.arrayBuffer();
  const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
  const totalPages = pdfDoc.getPageCount();

  const selectedIndices = parsePageRanges(pageRanges, totalPages);
  if (selectedIndices.length === 0) {
    throw new Error('No valid pages found in the specified range.');
  }

  if (onProgress) onProgress(50);
  const newPdf = await PDFDocument.create();
  const copiedPages = await newPdf.copyPages(pdfDoc, selectedIndices);
  copiedPages.forEach((page) => newPdf.addPage(page));

  if (onProgress) onProgress(90);
  const pdfBytes = await newPdf.save();
  if (onProgress) onProgress(100);

  return pdfBytes;
}

/**
 * Removes or reorders pages based on an ordered list of 0-indexed page indices
 */
export async function reorderAndRemovePages(
  file: File,
  pagesOrder: number[],
  onProgress?: (progress: number) => void
): Promise<Uint8Array> {
  if (onProgress) onProgress(20);
  const arrayBuffer = await file.arrayBuffer();
  const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });

  if (onProgress) onProgress(50);
  const newPdf = await PDFDocument.create();
  const copiedPages = await newPdf.copyPages(pdfDoc, pagesOrder);
  copiedPages.forEach((page) => newPdf.addPage(page));

  if (onProgress) onProgress(90);
  const pdfBytes = await newPdf.save();
  if (onProgress) onProgress(100);

  return pdfBytes;
}

/**
 * Converts one or multiple images into a single or multi-page PDF document
 */
export async function convertImagesToPdf(
  files: File[],
  options: {
    fitToPage?: boolean;
    pageSize?: 'A4' | 'fit';
  } = { fitToPage: true, pageSize: 'fit' },
  onProgress?: (progress: number) => void
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const imageBytes = await file.arrayBuffer();
    const mimeType = file.type.toLowerCase();

    let embeddedImage;
    if (mimeType.includes('png')) {
      embeddedImage = await pdfDoc.embedPng(imageBytes);
    } else {
      // JPG or convert others to JPG via canvas if needed
      try {
        embeddedImage = await pdfDoc.embedJpg(imageBytes);
      } catch {
        // Fallback for WebP / GIF / other image formats: convert to PNG in browser canvas
        const pngBlob = await convertImageToPngBlob(file);
        const pngBytes = await pngBlob.arrayBuffer();
        embeddedImage = await pdfDoc.embedPng(pngBytes);
      }
    }

    const imgDims = embeddedImage.scale(1);

    if (options.pageSize === 'A4') {
      // Standard A4 dimensions in points: 595.28 x 841.89
      const a4Width = 595.28;
      const a4Height = 841.89;
      const page = pdfDoc.addPage([a4Width, a4Height]);

      const scale = Math.min((a4Width - 40) / imgDims.width, (a4Height - 40) / imgDims.height, 1);
      const renderWidth = imgDims.width * scale;
      const renderHeight = imgDims.height * scale;
      const x = (a4Width - renderWidth) / 2;
      const y = (a4Height - renderHeight) / 2;

      page.drawImage(embeddedImage, {
        x,
        y,
        width: renderWidth,
        height: renderHeight,
      });
    } else {
      // Page dimensions match the image exactly
      const page = pdfDoc.addPage([imgDims.width, imgDims.height]);
      page.drawImage(embeddedImage, {
        x: 0,
        y: 0,
        width: imgDims.width,
        height: imgDims.height,
      });
    }

    if (onProgress) {
      onProgress(Math.round(((i + 1) / files.length) * 100));
    }
  }

  return await pdfDoc.save();
}

/**
 * Stamps text annotations, page headers, or watermarks onto a PDF
 */
export async function stampPdfText(
  file: File,
  options: {
    text: string;
    pageOption: 'all' | 'custom';
    customPages?: string;
    position?: 'center' | 'header' | 'footer' | 'custom';
    customX?: number;
    customY?: number;
    fontSize?: number;
    colorHex?: string;
    opacity?: number;
  },
  onProgress?: (progress: number) => void
): Promise<Uint8Array> {
  if (onProgress) onProgress(20);
  const arrayBuffer = await file.arrayBuffer();
  const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
  const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const totalPages = pdfDoc.getPageCount();
  const pagesToStamp =
    options.pageOption === 'all'
      ? Array.from({ length: totalPages }, (_, i) => i)
      : parsePageRanges(options.customPages || '1', totalPages);

  const fontSize = options.fontSize || 24;
  const opacity = options.opacity !== undefined ? options.opacity : 0.8;
  const color = hexToPdfRgb(options.colorHex || '#4f46e5');

  for (let idx = 0; idx < pagesToStamp.length; idx++) {
    const pageIndex = pagesToStamp[idx];
    const page = pdfDoc.getPage(pageIndex);
    const { width, height } = page.getSize();
    const textWidth = font.widthOfTextAtSize(options.text, fontSize);
    const textHeight = font.heightAtSize(fontSize);

    let x = (width - textWidth) / 2;
    let y = (height - textHeight) / 2;

    if (options.position === 'header') {
      y = height - textHeight - 30;
    } else if (options.position === 'footer') {
      y = 30;
    } else if (options.position === 'custom') {
      x = options.customX ?? x;
      y = options.customY ?? y;
    }

    page.drawText(options.text, {
      x,
      y,
      size: fontSize,
      font,
      color,
      opacity,
    });

    if (onProgress) {
      onProgress(20 + Math.round(((idx + 1) / pagesToStamp.length) * 70));
    }
  }

  const pdfBytes = await pdfDoc.save();
  if (onProgress) onProgress(100);
  return pdfBytes;
}

/**
 * Helper to convert any image file into a PNG blob using client HTML5 Canvas
 */
async function convertImageToPngBlob(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas context not available'));
        return;
      }
      ctx.drawImage(img, 0, 0);
      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Could not convert image to PNG'));
      }, 'image/png');
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image for PDF conversion'));
    };
    img.src = url;
  });
}

function hexToPdfRgb(hex: string) {
  const cleanHex = hex.replace('#', '');
  const r = parseInt(cleanHex.substring(0, 2), 16) / 255 || 0;
  const g = parseInt(cleanHex.substring(2, 4), 16) / 255 || 0;
  const b = parseInt(cleanHex.substring(4, 6), 16) / 255 || 0;
  return rgb(r, g, b);
}
