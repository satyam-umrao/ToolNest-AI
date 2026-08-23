'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Image as ImageIcon,
  Crop,
  Eraser,
  Sparkles,
  Maximize2,
  RotateCw,
  RotateCcw,
  FlipHorizontal,
  FlipVertical,
  Download,
  Loader2,
  Sliders,
  ShieldCheck,
  CheckCircle2,
  RefreshCw,
  ZoomIn,
  Palette,
} from 'lucide-react';
import FileUpload from '@/components/FileUpload';
import { downloadBlob, formatFileSize } from '@/lib/utils';
import {
  loadImage,
  cropImageClient,
  resizeImageClient,
  rotateAndFlipImageClient,
  enhanceImageClient,
  removeBackgroundClient,
  EnhanceFilters,
  CropRect,
} from '@/lib/clientImage';
import toast from 'react-hot-toast';

type Tool = 'crop' | 'resize' | 'rotate' | 'enhance' | 'remove-bg';

export default function ImagePage() {
  const [activeTool, setActiveTool] = useState<Tool>('crop');
  const [file, setFile] = useState<File | null>(null);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [originalDimensions, setOriginalDimensions] = useState<{ width: number; height: number }>({
    width: 0,
    height: 0,
  });

  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');

  // 1. Crop State
  const [cropAspectRatio, setCropAspectRatio] = useState<'free' | '1:1' | '16:9' | '4:3' | '9:16'>('free');
  const [cropRect, setCropRect] = useState<CropRect>({ x: 0, y: 0, width: 0, height: 0 });

  // 2. Resize State
  const [resizeWidth, setResizeWidth] = useState<number>(0);
  const [resizeHeight, setResizeHeight] = useState<number>(0);
  const [lockAspectRatio, setLockAspectRatio] = useState(true);
  const [exportFormat, setExportFormat] = useState<'image/png' | 'image/jpeg' | 'image/webp'>('image/png');
  const [exportQuality, setExportQuality] = useState(0.92);

  // 3. Rotate & Flip State
  const [rotationDegrees, setRotationDegrees] = useState(0);
  const [flipH, setFlipH] = useState(false);
  const [flipV, setFlipV] = useState(false);

  // 4. Enhance State
  const [filters, setFilters] = useState<EnhanceFilters>({
    brightness: 1.0,
    contrast: 1.0,
    saturation: 1.0,
    grayscale: 0,
    blur: 0,
    sepia: 0,
    sharpness: 0,
  });

  // 5. Remove BG State
  const [bgRemovedBlob, setBgRemovedBlob] = useState<Blob | null>(null);
  const [bgRemovedUrl, setBgRemovedUrl] = useState<string | null>(null);
  const [bgBackdropColor, setBgBackdropColor] = useState<string>('transparent');

  const tools = [
    {
      id: 'crop' as Tool,
      name: 'Crop Image',
      icon: Crop,
      description: 'Crop to custom dimensions or aspect ratios',
      badge: '0$ In-Browser',
    },
    {
      id: 'resize' as Tool,
      name: 'Resize Image',
      icon: Maximize2,
      description: 'Change image dimensions & compress output',
      badge: '0$ In-Browser',
    },
    {
      id: 'rotate' as Tool,
      name: 'Rotate & Flip',
      icon: RotateCw,
      description: 'Rotate by angles & flip horizontally/vertically',
      badge: '0$ In-Browser',
    },
    {
      id: 'enhance' as Tool,
      name: 'Enhance & Filter',
      icon: Sparkles,
      description: 'Adjust brightness, contrast, sharpness & saturation',
      badge: '0$ In-Browser',
    },
    {
      id: 'remove-bg' as Tool,
      name: 'Remove Background',
      icon: Eraser,
      description: 'Wasm AI in-browser automatic background removal',
      badge: '0$ Client AI',
    },
  ];

  const handleFileSelect = (f: File) => {
    setFile(f);
    const url = URL.createObjectURL(f);
    setImageSrc(url);
    setBgRemovedBlob(null);
    if (bgRemovedUrl) URL.revokeObjectURL(bgRemovedUrl);
    setBgRemovedUrl(null);

    const img = new Image();
    img.onload = () => {
      setOriginalDimensions({ width: img.naturalWidth, height: img.naturalHeight });
      setResizeWidth(img.naturalWidth);
      setResizeHeight(img.naturalHeight);
      setCropRect({
        x: 0,
        y: 0,
        width: img.naturalWidth,
        height: img.naturalHeight,
      });
    };
    img.src = url;
  };

  // Crop Handlers
  const applyCropPreset = (preset: 'free' | '1:1' | '16:9' | '4:3' | '9:16') => {
    setCropAspectRatio(preset);
    if (!originalDimensions.width) return;

    let w = originalDimensions.width;
    let h = originalDimensions.height;

    if (preset === '1:1') {
      const min = Math.min(w, h);
      w = min;
      h = min;
    } else if (preset === '16:9') {
      h = Math.round((w * 9) / 16);
      if (h > originalDimensions.height) {
        h = originalDimensions.height;
        w = Math.round((h * 16) / 9);
      }
    } else if (preset === '4:3') {
      h = Math.round((w * 3) / 4);
      if (h > originalDimensions.height) {
        h = originalDimensions.height;
        w = Math.round((h * 4) / 3);
      }
    } else if (preset === '9:16') {
      w = Math.round((h * 9) / 16);
      if (w > originalDimensions.width) {
        w = originalDimensions.width;
        h = Math.round((w * 16) / 9);
      }
    }

    setCropRect({
      x: Math.round((originalDimensions.width - w) / 2),
      y: Math.round((originalDimensions.height - h) / 2),
      width: w,
      height: h,
    });
  };

  const handleExecuteCrop = async () => {
    if (!imageSrc) return;
    setLoading(true);
    try {
      const blob = await cropImageClient(imageSrc, cropRect, exportFormat, exportQuality);
      downloadBlob(blob, `cropped_${file?.name || 'image.png'}`);
      toast.success('Image cropped and saved!');
    } catch (err: any) {
      toast.error(err.message || 'Crop failed');
    } finally {
      setLoading(false);
    }
  };

  // Resize Handlers
  const handleWidthChange = (val: number) => {
    setResizeWidth(val);
    if (lockAspectRatio && originalDimensions.width > 0) {
      const ratio = originalDimensions.height / originalDimensions.width;
      setResizeHeight(Math.round(val * ratio));
    }
  };

  const handleHeightChange = (val: number) => {
    setResizeHeight(val);
    if (lockAspectRatio && originalDimensions.height > 0) {
      const ratio = originalDimensions.width / originalDimensions.height;
      setResizeWidth(Math.round(val * ratio));
    }
  };

  const handleScaleShortcut = (pct: number) => {
    if (originalDimensions.width > 0) {
      setResizeWidth(Math.round(originalDimensions.width * (pct / 100)));
      setResizeHeight(Math.round(originalDimensions.height * (pct / 100)));
    }
  };

  const handleExecuteResize = async () => {
    if (!imageSrc) return;
    setLoading(true);
    try {
      const blob = await resizeImageClient(
        imageSrc,
        resizeWidth,
        resizeHeight,
        exportFormat,
        exportQuality
      );
      downloadBlob(blob, `resized_${resizeWidth}x${resizeHeight}_${file?.name || 'image.png'}`);
      toast.success('Image resized and saved!');
    } catch (err: any) {
      toast.error(err.message || 'Resize failed');
    } finally {
      setLoading(false);
    }
  };

  // Rotate Handlers
  const handleRotateStep = (delta: number) => {
    setRotationDegrees((prev) => (prev + delta) % 360);
  };

  const handleExecuteRotate = async () => {
    if (!imageSrc) return;
    setLoading(true);
    try {
      const blob = await rotateAndFlipImageClient(
        imageSrc,
        rotationDegrees,
        flipH,
        flipV,
        exportFormat,
        exportQuality
      );
      downloadBlob(blob, `rotated_${rotationDegrees}deg_${file?.name || 'image.png'}`);
      toast.success('Rotated image saved!');
    } catch (err: any) {
      toast.error(err.message || 'Rotate failed');
    } finally {
      setLoading(false);
    }
  };

  // Enhance Handlers
  const applyPresetFilter = (name: string) => {
    switch (name) {
      case 'reset':
        setFilters({ brightness: 1, contrast: 1, saturation: 1, grayscale: 0, blur: 0, sepia: 0, sharpness: 0 });
        break;
      case 'vivid':
        setFilters({ brightness: 1.1, contrast: 1.25, saturation: 1.4, grayscale: 0, blur: 0, sepia: 0, sharpness: 0.3 });
        break;
      case 'bw':
        setFilters({ brightness: 1.05, contrast: 1.2, saturation: 0, grayscale: 1, blur: 0, sepia: 0, sharpness: 0.2 });
        break;
      case 'vintage':
        setFilters({ brightness: 0.95, contrast: 1.1, saturation: 0.8, grayscale: 0, blur: 0, sepia: 0.6, sharpness: 0 });
        break;
      case 'sharp':
        setFilters({ brightness: 1, contrast: 1.1, saturation: 1.05, grayscale: 0, blur: 0, sepia: 0, sharpness: 0.8 });
        break;
    }
  };

  const handleExecuteEnhance = async () => {
    if (!imageSrc) return;
    setLoading(true);
    try {
      const blob = await enhanceImageClient(imageSrc, filters, exportFormat, exportQuality);
      downloadBlob(blob, `enhanced_${file?.name || 'image.png'}`);
      toast.success('Enhanced image saved!');
    } catch (err: any) {
      toast.error(err.message || 'Enhance failed');
    } finally {
      setLoading(false);
    }
  };

  // Remove BG Handlers
  const handleExecuteRemoveBg = async () => {
    if (!file) {
      toast.error('Please upload an image first');
      return;
    }

    setLoading(true);
    setProgress(0);
    setStatusMessage('Initializing in-browser AI model...');

    try {
      const resultBlob = await removeBackgroundClient(file, (pct, msg) => {
        setProgress(pct);
        setStatusMessage(msg);
      });

      setBgRemovedBlob(resultBlob);
      const url = URL.createObjectURL(resultBlob);
      setBgRemovedUrl(url);
      toast.success('Background removed completely client-side!');
    } catch (err: any) {
      toast.error(err.message || 'Failed to remove background');
    } finally {
      setLoading(false);
      setProgress(0);
    }
  };

  const handleDownloadRemovedBg = async () => {
    if (!bgRemovedBlob) return;

    if (bgBackdropColor === 'transparent') {
      downloadBlob(bgRemovedBlob, `no_bg_${file?.name.replace(/\.[^/.]+$/, '')}.png`);
      return;
    }

    // If custom background color chosen, composite client-side onto canvas
    const img = await loadImage(bgRemovedBlob);
    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = bgBackdropColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      canvas.toBlob((blob) => {
        if (blob) downloadBlob(blob, `colored_bg_${file?.name.replace(/\.[^/.]+$/, '')}.png`);
      }, 'image/png');
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header with 100% Client-Side / $0 Cost Badge */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-1 text-white">Image Processing Suite</h1>
          <p className="text-muted-foreground text-xs sm:text-sm md:text-base">
            Crop, resize, rotate, enhance, and remove backgrounds with 100% in-browser AI.
          </p>
        </div>
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold self-start md:self-auto">
          <ShieldCheck className="w-4 h-4 shrink-0" />
          <span>100% Client-Side • $0 Server Cost • Private</span>
        </div>
      </div>

      {/* Tool Selector Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5 sm:gap-3">
        {tools.map((tool) => {
          const Icon = tool.icon;
          const isActive = activeTool === tool.id;
          return (
            <button
              key={tool.id}
              onClick={() => setActiveTool(tool.id)}
              className={`flex flex-col items-start p-3 sm:p-4 rounded-2xl border transition-all text-left select-none ${
                isActive
                  ? 'bg-primary/10 border-primary shadow-lg shadow-primary/10 scale-[1.02]'
                  : 'glass-card border-white/10 hover:border-white/20'
              }`}
            >
              <div
                className={`p-2 sm:p-2.5 rounded-xl mb-2 sm:mb-3 ${
                  isActive ? 'bg-primary text-white' : 'bg-white/5 text-muted-foreground'
                }`}
              >
                <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <span className="font-bold text-xs sm:text-sm leading-tight mb-1">{tool.name}</span>
              <span className="text-[10px] sm:text-[11px] text-muted-foreground line-clamp-2">
                {tool.description}
              </span>
            </button>
          );
        })}
      </div>

      {/* Active Workspace */}
      <div className="glass-card p-4 sm:p-6 md:p-8 rounded-3xl border border-white/10 space-y-6">
        {!imageSrc ? (
          <FileUpload
            accept={{
              'image/png': ['.png'],
              'image/jpeg': ['.jpg', '.jpeg'],
              'image/webp': ['.webp'],
              'image/gif': ['.gif'],
            }}
            multiple={false}
            onDrop={(files) => files[0] && handleFileSelect(files[0])}
            title="Upload an image to start processing"
            subtitle="JPG, PNG, WebP, GIF supported (processed directly on your machine)"
          />
        ) : (
          <div className="space-y-6">
            {/* File Info Bar */}
            <div className="flex flex-wrap items-center justify-between p-3.5 bg-white/5 rounded-2xl border border-white/10 gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/20 rounded-xl text-primary">
                  <ImageIcon className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-semibold text-sm truncate max-w-xs">{file?.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {originalDimensions.width} × {originalDimensions.height} px •{' '}
                    {file ? formatFileSize(file.size) : ''}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    setImageSrc(null);
                    setFile(null);
                  }}
                  className="text-xs text-muted-foreground hover:text-white px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10"
                >
                  Change Image
                </button>
              </div>
            </div>

            {/* ========================================================= */}
            {/* 1. CROP WORKSPACE */}
            {/* ========================================================= */}
            {activeTool === 'crop' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Preview Box */}
                <div className="lg:col-span-2 flex flex-col items-center justify-center p-6 bg-black/40 rounded-2xl border border-white/10 relative overflow-hidden min-h-[380px]">
                  <div className="relative max-h-[420px] overflow-hidden flex items-center justify-center">
                    <img
                      src={imageSrc}
                      alt="Crop preview"
                      className="max-h-[380px] w-auto object-contain rounded-lg shadow-2xl"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-3">
                    Selected Crop Area: {cropRect.width} × {cropRect.height} px (at X:{cropRect.x}, Y:{cropRect.y})
                  </p>
                </div>

                {/* Controls */}
                <div className="space-y-5 flex flex-col justify-between">
                  <div className="space-y-4">
                    <h3 className="text-lg font-bold">Aspect Ratio Presets</h3>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { id: 'free', label: 'Freeform' },
                        { id: '1:1', label: '1:1 Square' },
                        { id: '16:9', label: '16:9 Landscape' },
                        { id: '4:3', label: '4:3 Standard' },
                        { id: '9:16', label: '9:16 Reel / Story' },
                      ].map((preset) => (
                        <button
                          key={preset.id}
                          onClick={() => applyCropPreset(preset.id as any)}
                          className={`px-3 py-2 rounded-xl text-xs font-semibold border transition ${
                            cropAspectRatio === preset.id
                              ? 'bg-primary border-primary text-white'
                              : 'bg-white/5 border-white/10 hover:bg-white/10'
                          }`}
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>

                    <div className="space-y-3 pt-2">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs font-semibold text-muted-foreground uppercase">
                            Crop Width (px)
                          </label>
                          <input
                            type="number"
                            min="1"
                            max={originalDimensions.width}
                            value={cropRect.width}
                            onChange={(e) =>
                              setCropRect({ ...cropRect, width: parseInt(e.target.value) || 10 })
                            }
                            className="w-full mt-1 px-3 py-2 bg-black/20 border border-white/10 rounded-xl text-sm"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-muted-foreground uppercase">
                            Crop Height (px)
                          </label>
                          <input
                            type="number"
                            min="1"
                            max={originalDimensions.height}
                            value={cropRect.height}
                            onChange={(e) =>
                              setCropRect({ ...cropRect, height: parseInt(e.target.value) || 10 })
                            }
                            className="w-full mt-1 px-3 py-2 bg-black/20 border border-white/10 rounded-xl text-sm"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs font-semibold text-muted-foreground uppercase">
                            Offset X (px)
                          </label>
                          <input
                            type="number"
                            min="0"
                            max={originalDimensions.width - cropRect.width}
                            value={cropRect.x}
                            onChange={(e) =>
                              setCropRect({ ...cropRect, x: parseInt(e.target.value) || 0 })
                            }
                            className="w-full mt-1 px-3 py-2 bg-black/20 border border-white/10 rounded-xl text-sm"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-muted-foreground uppercase">
                            Offset Y (px)
                          </label>
                          <input
                            type="number"
                            min="0"
                            max={originalDimensions.height - cropRect.height}
                            value={cropRect.y}
                            onChange={(e) =>
                              setCropRect({ ...cropRect, y: parseInt(e.target.value) || 0 })
                            }
                            className="w-full mt-1 px-3 py-2 bg-black/20 border border-white/10 rounded-xl text-sm"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <button
                    disabled={loading}
                    onClick={handleExecuteCrop}
                    className="btn-premium w-full py-4 flex items-center justify-center gap-2 mt-4"
                  >
                    {loading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        <Crop className="w-5 h-5" />
                        <span>Crop & Download Image</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* ========================================================= */}
            {/* 2. RESIZE WORKSPACE */}
            {/* ========================================================= */}
            {activeTool === 'resize' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 flex flex-col items-center justify-center p-6 bg-black/40 rounded-2xl border border-white/10 min-h-[380px]">
                  <img
                    src={imageSrc}
                    alt="Resize preview"
                    className="max-h-[360px] w-auto object-contain rounded-lg shadow-xl"
                  />
                  <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
                    <span>
                      Current: {originalDimensions.width} × {originalDimensions.height} px
                    </span>
                    <span>→</span>
                    <span className="text-primary font-bold">
                      Target: {resizeWidth} × {resizeHeight} px
                    </span>
                  </div>
                </div>

                <div className="space-y-5 flex flex-col justify-between">
                  <div className="space-y-4">
                    <h3 className="text-lg font-bold">Resize Settings</h3>

                    {/* Quick Percentage Shortcuts */}
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground uppercase">
                        Scale Percentage
                      </label>
                      <div className="grid grid-cols-4 gap-2 mt-1.5">
                        {[25, 50, 75, 150].map((pct) => (
                          <button
                            key={pct}
                            onClick={() => handleScaleShortcut(pct)}
                            className="px-2.5 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs font-medium"
                          >
                            {pct}%
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-semibold text-muted-foreground uppercase">
                          Width (px)
                        </label>
                        <input
                          type="number"
                          value={resizeWidth}
                          onChange={(e) => handleWidthChange(parseInt(e.target.value) || 1)}
                          className="w-full mt-1 px-3 py-2 bg-black/20 border border-white/10 rounded-xl text-sm"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-muted-foreground uppercase">
                          Height (px)
                        </label>
                        <input
                          type="number"
                          value={resizeHeight}
                          onChange={(e) => handleHeightChange(parseInt(e.target.value) || 1)}
                          className="w-full mt-1 px-3 py-2 bg-black/20 border border-white/10 rounded-xl text-sm"
                        />
                      </div>
                    </div>

                    <label className="flex items-center gap-2 text-xs cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={lockAspectRatio}
                        onChange={(e) => setLockAspectRatio(e.target.checked)}
                        className="rounded accent-primary w-4 h-4"
                      />
                      <span>Lock Aspect Ratio</span>
                    </label>

                    <div className="pt-2 border-t border-white/10 space-y-3">
                      <div>
                        <label className="text-xs font-semibold text-muted-foreground uppercase">
                          Export Format
                        </label>
                        <select
                          value={exportFormat}
                          onChange={(e) => setExportFormat(e.target.value as any)}
                          className="w-full mt-1 px-3 py-2 bg-black/40 border border-white/10 rounded-xl text-sm text-white"
                        >
                          <option value="image/png">PNG (Lossless)</option>
                          <option value="image/jpeg">JPEG (Compressed)</option>
                          <option value="image/webp">WebP (Modern Web)</option>
                        </select>
                      </div>

                      {exportFormat !== 'image/png' && (
                        <div>
                          <label className="text-xs font-semibold text-muted-foreground uppercase">
                            Quality ({Math.round(exportQuality * 100)}%)
                          </label>
                          <input
                            type="range"
                            min="0.1"
                            max="1.0"
                            step="0.05"
                            value={exportQuality}
                            onChange={(e) => setExportQuality(parseFloat(e.target.value))}
                            className="w-full mt-1.5 accent-primary"
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  <button
                    disabled={loading || resizeWidth <= 0 || resizeHeight <= 0}
                    onClick={handleExecuteResize}
                    className="btn-premium w-full py-4 flex items-center justify-center gap-2 mt-4"
                  >
                    {loading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        <Maximize2 className="w-5 h-5" />
                        <span>Resize & Download</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* ========================================================= */}
            {/* 3. ROTATE & FLIP WORKSPACE */}
            {/* ========================================================= */}
            {activeTool === 'rotate' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 flex flex-col items-center justify-center p-6 bg-black/40 rounded-2xl border border-white/10 min-h-[380px] overflow-hidden">
                  <div
                    style={{
                      transform: `rotate(${rotationDegrees}deg) scaleX(${flipH ? -1 : 1}) scaleY(${
                        flipV ? -1 : 1
                      })`,
                      transition: 'transform 0.2s ease-out',
                    }}
                    className="max-h-[340px] max-w-full flex items-center justify-center"
                  >
                    <img
                      src={imageSrc}
                      alt="Rotate preview"
                      className="max-h-[320px] w-auto object-contain rounded-lg shadow-xl"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-4">
                    Rotation: {rotationDegrees}° • Flip H: {flipH ? 'Yes' : 'No'} • Flip V:{' '}
                    {flipV ? 'Yes' : 'No'}
                  </p>
                </div>

                <div className="space-y-5 flex flex-col justify-between">
                  <div className="space-y-4">
                    <h3 className="text-lg font-bold">Rotate & Flip Controls</h3>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => handleRotateStep(-90)}
                        className="px-3 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-semibold flex items-center justify-center gap-2"
                      >
                        <RotateCcw className="w-4 h-4" />
                        <span>-90° Left</span>
                      </button>
                      <button
                        onClick={() => handleRotateStep(90)}
                        className="px-3 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-semibold flex items-center justify-center gap-2"
                      >
                        <RotateCw className="w-4 h-4" />
                        <span>+90° Right</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => setFlipH(!flipH)}
                        className={`px-3 py-2.5 border rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition ${
                          flipH
                            ? 'bg-primary border-primary text-white'
                            : 'bg-white/5 border-white/10 hover:bg-white/10'
                        }`}
                      >
                        <FlipHorizontal className="w-4 h-4" />
                        <span>Flip Horizontal</span>
                      </button>
                      <button
                        onClick={() => setFlipV(!flipV)}
                        className={`px-3 py-2.5 border rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition ${
                          flipV
                            ? 'bg-primary border-primary text-white'
                            : 'bg-white/5 border-white/10 hover:bg-white/10'
                        }`}
                      >
                        <FlipVertical className="w-4 h-4" />
                        <span>Flip Vertical</span>
                      </button>
                    </div>

                    <div>
                      <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground uppercase">
                        <span>Custom Angle</span>
                        <span>{rotationDegrees}°</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="360"
                        value={rotationDegrees}
                        onChange={(e) => setRotationDegrees(parseInt(e.target.value))}
                        className="w-full mt-2 accent-primary"
                      />
                    </div>

                    <button
                      onClick={() => {
                        setRotationDegrees(0);
                        setFlipH(false);
                        setFlipV(false);
                      }}
                      className="text-xs text-muted-foreground hover:text-white flex items-center gap-1.5"
                    >
                      <RefreshCw className="w-3.5 h-3.5" /> Reset Orientation
                    </button>
                  </div>

                  <button
                    disabled={loading}
                    onClick={handleExecuteRotate}
                    className="btn-premium w-full py-4 flex items-center justify-center gap-2 mt-4"
                  >
                    {loading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        <RotateCw className="w-5 h-5" />
                        <span>Export Rotated Image</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* ========================================================= */}
            {/* 4. ENHANCE WORKSPACE */}
            {/* ========================================================= */}
            {activeTool === 'enhance' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 flex flex-col items-center justify-center p-6 bg-black/40 rounded-2xl border border-white/10 min-h-[380px]">
                  <img
                    src={imageSrc}
                    alt="Enhance preview"
                    style={{
                      filter: `brightness(${filters.brightness * 100}%) contrast(${
                        filters.contrast * 100
                      }%) saturate(${filters.saturation * 100}%) grayscale(${
                        filters.grayscale * 100
                      }%) sepia(${filters.sepia * 100}%) blur(${filters.blur}px)`,
                    }}
                    className="max-h-[360px] w-auto object-contain rounded-lg shadow-xl"
                  />
                </div>

                <div className="space-y-4 flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-bold">Image Enhancements</h3>
                      <button
                        onClick={() => applyPresetFilter('reset')}
                        className="text-xs text-muted-foreground hover:text-white"
                      >
                        Reset
                      </button>
                    </div>

                    {/* Presets */}
                    <div className="grid grid-cols-4 gap-1.5">
                      {['vivid', 'bw', 'vintage', 'sharp'].map((p) => (
                        <button
                          key={p}
                          onClick={() => applyPresetFilter(p)}
                          className="px-2 py-1 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-[11px] font-semibold capitalize"
                        >
                          {p}
                        </button>
                      ))}
                    </div>

                    {/* Filter Sliders */}
                    <div className="space-y-2.5 pt-2 max-h-[260px] overflow-y-auto pr-1">
                      <div>
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>Brightness</span>
                          <span>{Math.round(filters.brightness * 100)}%</span>
                        </div>
                        <input
                          type="range"
                          min="0.2"
                          max="2.0"
                          step="0.05"
                          value={filters.brightness}
                          onChange={(e) =>
                            setFilters({ ...filters, brightness: parseFloat(e.target.value) })
                          }
                          className="w-full accent-primary"
                        />
                      </div>

                      <div>
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>Contrast</span>
                          <span>{Math.round(filters.contrast * 100)}%</span>
                        </div>
                        <input
                          type="range"
                          min="0.2"
                          max="2.0"
                          step="0.05"
                          value={filters.contrast}
                          onChange={(e) =>
                            setFilters({ ...filters, contrast: parseFloat(e.target.value) })
                          }
                          className="w-full accent-primary"
                        />
                      </div>

                      <div>
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>Saturation</span>
                          <span>{Math.round(filters.saturation * 100)}%</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="2.5"
                          step="0.05"
                          value={filters.saturation}
                          onChange={(e) =>
                            setFilters({ ...filters, saturation: parseFloat(e.target.value) })
                          }
                          className="w-full accent-primary"
                        />
                      </div>

                      <div>
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>Sharpness (Convolution)</span>
                          <span>{filters.sharpness.toFixed(1)}</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="2.0"
                          step="0.1"
                          value={filters.sharpness}
                          onChange={(e) =>
                            setFilters({ ...filters, sharpness: parseFloat(e.target.value) })
                          }
                          className="w-full accent-primary"
                        />
                      </div>

                      <div>
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>Sepia</span>
                          <span>{Math.round(filters.sepia * 100)}%</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="1.0"
                          step="0.05"
                          value={filters.sepia}
                          onChange={(e) =>
                            setFilters({ ...filters, sepia: parseFloat(e.target.value) })
                          }
                          className="w-full accent-primary"
                        />
                      </div>
                    </div>
                  </div>

                  <button
                    disabled={loading}
                    onClick={handleExecuteEnhance}
                    className="btn-premium w-full py-4 flex items-center justify-center gap-2 mt-2"
                  >
                    {loading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5" />
                        <span>Export Enhanced Image</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* ========================================================= */}
            {/* 5. REMOVE BACKGROUND WORKSPACE */}
            {/* ========================================================= */}
            {activeTool === 'remove-bg' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Original Image */}
                  <div className="flex flex-col items-center justify-center p-6 bg-black/40 rounded-2xl border border-white/10 min-h-[320px]">
                    <span className="text-xs font-semibold text-muted-foreground uppercase mb-3">
                      Original Image
                    </span>
                    <img
                      src={imageSrc}
                      alt="Original"
                      className="max-h-[260px] w-auto object-contain rounded-lg"
                    />
                  </div>

                  {/* Result Image */}
                  <div
                    style={{
                      backgroundColor:
                        bgBackdropColor === 'transparent' ? undefined : bgBackdropColor,
                    }}
                    className={`flex flex-col items-center justify-center p-6 rounded-2xl border border-white/10 min-h-[320px] relative ${
                      bgBackdropColor === 'transparent'
                        ? 'bg-[radial-gradient(#ffffff22_1px,transparent_1px)] [background-size:16px_16px] bg-black/50'
                        : ''
                    }`}
                  >
                    <span className="text-xs font-semibold text-muted-foreground uppercase mb-3">
                      Result (Cutout)
                    </span>

                    {loading ? (
                      <div className="text-center space-y-3">
                        <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto" />
                        <p className="font-semibold text-sm">{statusMessage || 'Processing AI...'}</p>
                        {progress > 0 && (
                          <div className="w-48 bg-white/10 rounded-full h-2 mx-auto overflow-hidden">
                            <div
                              className="bg-primary h-full transition-all duration-300"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                        )}
                        <p className="text-[11px] text-muted-foreground">
                          Running 100% inside your browser via Wasm AI ($0 server cost)
                        </p>
                      </div>
                    ) : bgRemovedUrl ? (
                      <img
                        src={bgRemovedUrl}
                        alt="Cutout result"
                        className="max-h-[260px] w-auto object-contain"
                      />
                    ) : (
                      <div className="text-center text-muted-foreground text-sm space-y-2">
                        <Eraser className="w-8 h-8 mx-auto opacity-40" />
                        <p>Click below to remove background with in-browser AI</p>
                      </div>
                    )}
                  </div>
                </div>

                {bgRemovedUrl && (
                  <div className="flex flex-wrap items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10 gap-4">
                    <div className="flex items-center gap-3">
                      <Palette className="w-5 h-5 text-muted-foreground" />
                      <span className="text-xs font-semibold uppercase text-muted-foreground">
                        Backdrop:
                      </span>
                      <div className="flex items-center gap-2">
                        {['transparent', '#ffffff', '#000000', '#6366f1', '#10b981', '#f59e0b'].map(
                          (color) => (
                            <button
                              key={color}
                              onClick={() => setBgBackdropColor(color)}
                              style={{ backgroundColor: color === 'transparent' ? '#222' : color }}
                              className={`w-7 h-7 rounded-full border-2 transition ${
                                bgBackdropColor === color
                                  ? 'border-primary scale-110'
                                  : 'border-white/20'
                              }`}
                              title={color}
                            />
                          )
                        )}
                      </div>
                    </div>

                    <button
                      onClick={handleDownloadRemovedBg}
                      className="btn-premium px-6 py-2.5 flex items-center gap-2 text-sm"
                    >
                      <Download className="w-4 h-4" />
                      <span>Download Cutout PNG</span>
                    </button>
                  </div>
                )}

                {!bgRemovedUrl && (
                  <button
                    disabled={loading}
                    onClick={handleExecuteRemoveBg}
                    className="btn-premium w-full py-4 flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Processing in Browser ({progress}%)...</span>
                      </>
                    ) : (
                      <>
                        <Eraser className="w-5 h-5" />
                        <span>Remove Background (100% Client-Side AI)</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
