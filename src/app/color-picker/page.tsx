'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Pipette,
  Copy,
  CheckCircle2,
  Palette,
  Download,
  Image as ImageIcon,
  ShieldCheck,
  Zap,
  Eye,
  Layers,
  Sparkles,
} from 'lucide-react';
import FileUpload from '@/components/FileUpload';
import { copyToClipboard } from '@/lib/utils';
import {
  ColorData,
  openNativeEyeDropper,
  isEyeDropperSupported,
  pickColorFromCanvas,
  extractDominantPalette,
  parseColorFromHex,
} from '@/lib/clientColor';
import toast from 'react-hot-toast';

export default function ColorPickerPage() {
  const [file, setFile] = useState<File | null>(null);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<ColorData | null>({
    hex: '#6366f1',
    rgb: { r: 99, g: 102, b: 241 },
    hsl: { h: 239, s: 84, l: 67 },
    cmyk: { c: 59, m: 58, y: 0, k: 5 },
  });
  const [palette, setPalette] = useState<ColorData[]>([]);
  const [copiedValue, setCopiedValue] = useState<string>('');
  const [hoverColor, setHoverColor] = useState<string | null>(null);
  const [loupePos, setLoupePos] = useState<{ x: number; y: number; visible: boolean }>({
    x: 0,
    y: 0,
    visible: false,
  });

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const imageElementRef = useRef<HTMLImageElement | null>(null);

  const handleFileSelect = async (f: File) => {
    setFile(f);
    const url = URL.createObjectURL(f);
    setImageSrc(url);

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = async () => {
      imageElementRef.current = img;
      renderImageToCanvas(img);
      // Automatically generate palette client-side
      try {
        const extracted = await extractDominantPalette(f, 8);
        setPalette(extracted);
        if (extracted[0]) setSelectedColor(extracted[0]);
      } catch (err) {
        console.error('Palette extraction error:', err);
      }
    };
    img.src = url;
  };

  const renderImageToCanvas = (img: HTMLImageElement) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (ctx) {
      ctx.drawImage(img, 0, 0);
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const canvasX = (e.clientX - rect.left) * scaleX;
    const canvasY = (e.clientY - rect.top) * scaleY;

    try {
      const color = pickColorFromCanvas(canvas, canvasX, canvasY);
      setHoverColor(color.hex);
      setLoupePos({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
        visible: true,
      });
    } catch {
      // Ignore boundary errors
    }
  };

  const handleCanvasMouseLeave = () => {
    setLoupePos((prev) => ({ ...prev, visible: false }));
    setHoverColor(null);
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const canvasX = (e.clientX - rect.left) * scaleX;
    const canvasY = (e.clientY - rect.top) * scaleY;

    const color = pickColorFromCanvas(canvas, canvasX, canvasY);
    setSelectedColor(color);
    toast.success(`Picked color ${color.hex}`);
  };

  const handleNativeEyeDropper = async () => {
    try {
      const color = await openNativeEyeDropper();
      if (color) {
        setSelectedColor(color);
        toast.success(`Sampled color ${color.hex}`);
      }
    } catch (err: any) {
      toast.error(err.message || 'EyeDropper not available');
    }
  };

  const handleCopy = async (value: string, label: string) => {
    await copyToClipboard(value);
    setCopiedValue(value);
    toast.success(`${label} copied to clipboard!`);
    setTimeout(() => setCopiedValue(''), 2000);
  };

  const handleDirectHexInput = (hex: string) => {
    try {
      const parsed = parseColorFromHex(hex);
      setSelectedColor(parsed);
    } catch {
      // Ignore incomplete hex typing
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-1 text-white">Color Picker & Palette Generator</h1>
          <p className="text-muted-foreground text-xs sm:text-sm md:text-base">
            Pick colors with pixel-precision loupe, EyeDropper API, and extract palettes 100% in-browser.
          </p>
        </div>
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold self-start md:self-auto">
          <ShieldCheck className="w-4 h-4 shrink-0" />
          <span>100% Client-Side • $0 Cost • Privacy Guaranteed</span>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Image Canvas / EyeDropper Area */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-card p-4 sm:p-6 md:p-8 rounded-3xl border border-white/10 space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-bold">Image Pixel Color Sampler</h3>
                <p className="text-xs text-muted-foreground">
                  Hover to inspect pixels in real-time. Click to select any color.
                </p>
              </div>

              <div className="flex items-center gap-2">
                {isEyeDropperSupported() && (
                  <button
                    onClick={handleNativeEyeDropper}
                    className="btn-premium px-4 py-2 text-xs flex items-center gap-1.5"
                  >
                    <Pipette className="w-4 h-4" />
                    <span>EyeDropper (Screen Picker)</span>
                  </button>
                )}
                {imageSrc && (
                  <button
                    onClick={() => {
                      setImageSrc(null);
                      setFile(null);
                    }}
                    className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs"
                  >
                    Change Image
                  </button>
                )}
              </div>
            </div>

            {!imageSrc ? (
              <FileUpload
                accept={{
                  'image/png': ['.png'],
                  'image/jpeg': ['.jpg', '.jpeg'],
                  'image/webp': ['.webp'],
                  'image/svg+xml': ['.svg'],
                }}
                multiple={false}
                onDrop={(files) => files[0] && handleFileSelect(files[0])}
                title="Upload an image to pick colors & extract palettes"
                subtitle="Supports PNG, JPG, WebP, SVG (processed 100% locally)"
              />
            ) : (
              <div className="relative flex items-center justify-center p-4 bg-black/40 rounded-2xl border border-white/10 overflow-hidden min-h-[360px]">
                <canvas
                  ref={canvasRef}
                  onMouseMove={handleCanvasMouseMove}
                  onMouseLeave={handleCanvasMouseLeave}
                  onClick={handleCanvasClick}
                  className="max-h-[420px] max-w-full w-auto object-contain cursor-crosshair rounded-lg shadow-2xl"
                />

                {/* Floating Loupe / Color Magnifier */}
                {loupePos.visible && hoverColor && (
                  <div
                    style={{
                      left: Math.min(loupePos.x + 15, 300),
                      top: Math.max(loupePos.y - 60, 10),
                    }}
                    className="pointer-events-none absolute z-30 flex items-center gap-2 px-3 py-1.5 bg-black/90 border border-white/20 backdrop-blur-md rounded-xl shadow-2xl text-xs font-mono text-white"
                  >
                    <div
                      style={{ backgroundColor: hoverColor }}
                      className="w-5 h-5 rounded-md border border-white/30"
                    />
                    <span className="font-bold">{hoverColor.toUpperCase()}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Dominant Palette Section */}
          {palette.length > 0 && (
            <div className="glass-card p-6 rounded-3xl border border-white/10 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Palette className="w-5 h-5 text-primary" />
                  <h3 className="font-bold text-base">Extracted Dominant Palette</h3>
                </div>
                <span className="text-xs text-muted-foreground font-mono">
                  {palette.length} Dominant Colors
                </span>
              </div>

              <div className="grid grid-cols-4 sm:grid-cols-8 gap-3">
                {palette.map((color, idx) => (
                  <button
                    key={`${color.hex}-${idx}`}
                    onClick={() => {
                      setSelectedColor(color);
                      toast.success(`Selected ${color.hex}`);
                    }}
                    className={`group flex flex-col items-center p-2 rounded-2xl border transition-all ${
                      selectedColor?.hex.toLowerCase() === color.hex.toLowerCase()
                        ? 'border-primary bg-primary/10 scale-105 shadow-lg shadow-primary/20'
                        : 'border-white/10 hover:border-white/30 bg-white/5'
                    }`}
                  >
                    <div
                      style={{ backgroundColor: color.hex }}
                      className="w-full aspect-square rounded-xl border border-white/20 mb-2 shadow-inner group-hover:scale-105 transition"
                    />
                    <span className="text-[11px] font-mono font-semibold uppercase truncate">
                      {color.hex}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right 1 Col: Selected Color Details & Code Snippets */}
        <div className="space-y-6">
          <div className="glass-card p-6 md:p-8 rounded-3xl border border-white/10 space-y-6">
            <h3 className="text-lg font-bold">Selected Color</h3>

            {selectedColor && (
              <div className="space-y-6">
                {/* Big Color Preview Box */}
                <div className="relative">
                  <div
                    style={{ backgroundColor: selectedColor.hex }}
                    className="w-full h-36 rounded-2xl border border-white/20 shadow-2xl transition-colors duration-200"
                  />
                  <div className="absolute top-3 right-3 flex items-center gap-2">
                    <input
                      type="color"
                      value={selectedColor.hex}
                      onChange={(e) => handleDirectHexInput(e.target.value)}
                      className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0 opacity-0 absolute"
                    />
                    <div className="p-2 bg-black/60 backdrop-blur-md rounded-xl text-white text-xs flex items-center gap-1.5 cursor-pointer pointer-events-none">
                      <Palette className="w-3.5 h-3.5" />
                      <span>Custom</span>
                    </div>
                  </div>
                </div>

                {/* Color Values & Copy Buttons */}
                <div className="space-y-3">
                  {/* HEX */}
                  <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/10">
                    <div>
                      <p className="text-[10px] uppercase font-bold text-muted-foreground">HEX</p>
                      <p className="font-mono font-bold text-sm uppercase">{selectedColor.hex}</p>
                    </div>
                    <button
                      onClick={() => handleCopy(selectedColor.hex, 'HEX')}
                      className="p-2 rounded-lg hover:bg-white/10 text-muted-foreground hover:text-white"
                      title="Copy HEX"
                    >
                      {copiedValue === selectedColor.hex ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  </div>

                  {/* RGB */}
                  <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/10">
                    <div>
                      <p className="text-[10px] uppercase font-bold text-muted-foreground">RGB</p>
                      <p className="font-mono text-sm">
                        rgb({selectedColor.rgb.r}, {selectedColor.rgb.g}, {selectedColor.rgb.b})
                      </p>
                    </div>
                    <button
                      onClick={() =>
                        handleCopy(
                          `rgb(${selectedColor.rgb.r}, ${selectedColor.rgb.g}, ${selectedColor.rgb.b})`,
                          'RGB'
                        )
                      }
                      className="p-2 rounded-lg hover:bg-white/10 text-muted-foreground hover:text-white"
                      title="Copy RGB"
                    >
                      {copiedValue ===
                      `rgb(${selectedColor.rgb.r}, ${selectedColor.rgb.g}, ${selectedColor.rgb.b})` ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  </div>

                  {/* HSL */}
                  <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/10">
                    <div>
                      <p className="text-[10px] uppercase font-bold text-muted-foreground">HSL</p>
                      <p className="font-mono text-sm">
                        hsl({selectedColor.hsl.h}, {selectedColor.hsl.s}%, {selectedColor.hsl.l}%)
                      </p>
                    </div>
                    <button
                      onClick={() =>
                        handleCopy(
                          `hsl(${selectedColor.hsl.h}, ${selectedColor.hsl.s}%, ${selectedColor.hsl.l}%)`,
                          'HSL'
                        )
                      }
                      className="p-2 rounded-lg hover:bg-white/10 text-muted-foreground hover:text-white"
                      title="Copy HSL"
                    >
                      {copiedValue ===
                      `hsl(${selectedColor.hsl.h}, ${selectedColor.hsl.s}%, ${selectedColor.hsl.l}%)` ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  </div>

                  {/* CMYK */}
                  <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/10">
                    <div>
                      <p className="text-[10px] uppercase font-bold text-muted-foreground">CMYK</p>
                      <p className="font-mono text-sm">
                        cmyk({selectedColor.cmyk.c}%, {selectedColor.cmyk.m}%, {selectedColor.cmyk.y}
                        %, {selectedColor.cmyk.k}%)
                      </p>
                    </div>
                    <button
                      onClick={() =>
                        handleCopy(
                          `cmyk(${selectedColor.cmyk.c}%, ${selectedColor.cmyk.m}%, ${selectedColor.cmyk.y}%, ${selectedColor.cmyk.k}%)`,
                          'CMYK'
                        )
                      }
                      className="p-2 rounded-lg hover:bg-white/10 text-muted-foreground hover:text-white"
                      title="Copy CMYK"
                    >
                      {copiedValue ===
                      `cmyk(${selectedColor.cmyk.c}%, ${selectedColor.cmyk.m}%, ${selectedColor.cmyk.y}%, ${selectedColor.cmyk.k}%)` ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* CSS Variable / Tailwind Shortcut */}
                <div className="space-y-2 pt-2 border-t border-white/10">
                  <p className="text-xs font-semibold text-muted-foreground uppercase">
                    Developer Snippets
                  </p>
                  <button
                    onClick={() =>
                      handleCopy(`--primary-color: ${selectedColor.hex};`, 'CSS Variable')
                    }
                    className="w-full text-left px-3 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-xs font-mono flex items-center justify-between"
                  >
                    <span className="truncate">{`--primary: ${selectedColor.hex};`}</span>
                    <Copy className="w-3.5 h-3.5 text-muted-foreground shrink-0 ml-2" />
                  </button>
                  <button
                    onClick={() =>
                      handleCopy(`bg-[${selectedColor.hex}]`, 'Tailwind class')
                    }
                    className="w-full text-left px-3 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-xs font-mono flex items-center justify-between"
                  >
                    <span className="truncate">{`bg-[${selectedColor.hex}]`}</span>
                    <Copy className="w-3.5 h-3.5 text-muted-foreground shrink-0 ml-2" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
