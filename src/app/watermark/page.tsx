"use client";

import { useState, useRef } from "react";
import {
  Sparkles,
  Image as ImageIcon,
  Download,
  Copy,
  Loader2,
  ShieldCheck,
  CheckCircle2,
  RefreshCw,
  Paintbrush,
  Layers,
  ExternalLink,
} from "lucide-react";
import FileUpload from "@/components/FileUpload";
import { downloadBlob } from "@/lib/utils";
import {
  removeGeminiWatermarkFromImage,
  GeminiRemovalResult,
} from "@/lib/geminiWatermark";
import toast from "react-hot-toast";

type WatermarkTab = "gemini" | "magic-brush";

interface BatchItem {
  file: File;
  previewUrl: string;
  result?: GeminiRemovalResult;
  status: "pending" | "processing" | "done" | "error";
  error?: string;
}

export default function WatermarkPage() {
  const [activeTab, setActiveTab] = useState<WatermarkTab>("gemini");
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  // =========================================================================
  // 1. Gemini Watermark Remover State
  // =========================================================================
  const [geminiFile, setGeminiFile] = useState<File | null>(null);
  const [geminiPreview, setGeminiPreview] = useState<string | null>(null);
  const [geminiResult, setGeminiResult] = useState<GeminiRemovalResult | null>(
    null,
  );
  const [sliderPosition, setSliderPosition] = useState(50); // comparison slider %
  const [batchItems, setBatchItems] = useState<BatchItem[]>([]);
  const [isBatchMode, setIsBatchMode] = useState(false);

  // =========================================================================
  // 2. Image Magic Brush State
  // =========================================================================
  const [brushFile, setBrushFile] = useState<File | null>(null);
  const [brushImageSrc, setBrushImageSrc] = useState<string | null>(null);
  const [brushSize, setBrushSize] = useState(25);
  const [isDrawing, setIsDrawing] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const historyRef = useRef<ImageData[]>([]);

  // =========================================================================
  // Gemini Handlers
  // =========================================================================
  const handleGeminiSingleSelect = async (file: File) => {
    setGeminiFile(file);
    const url = URL.createObjectURL(file);
    setGeminiPreview(url);
    setGeminiResult(null);
    setSliderPosition(50);

    setLoading(true);
    try {
      const result = await removeGeminiWatermarkFromImage(file);
      setGeminiResult(result);
      toast.success(
        "Gemini watermark removed with exact mathematical precision!",
      );
    } catch (err: any) {
      toast.error(err.message || "Failed to remove watermark");
    } finally {
      setLoading(false);
    }
  };

  const handleGeminiBatchSelect = async (files: File[]) => {
    if (files.length === 1) {
      setIsBatchMode(false);
      handleGeminiSingleSelect(files[0]);
      return;
    }

    setIsBatchMode(true);
    const items: BatchItem[] = files.map((f) => ({
      file: f,
      previewUrl: URL.createObjectURL(f),
      status: "pending",
    }));
    setBatchItems(items);

    setLoading(true);
    for (let i = 0; i < items.length; i++) {
      items[i].status = "processing";
      setBatchItems([...items]);

      try {
        const res = await removeGeminiWatermarkFromImage(items[i].file);
        items[i].result = res;
        items[i].status = "done";
      } catch (err: any) {
        items[i].status = "error";
        items[i].error = err.message || "Error";
      }
      setBatchItems([...items]);
      setProgress(Math.round(((i + 1) / items.length) * 100));
    }
    setLoading(false);
    toast.success(`Processed ${files.length} Gemini images!`);
  };

  const handleCopyCleanImage = async () => {
    if (!geminiResult) return;
    try {
      await navigator.clipboard.write([
        new ClipboardItem({
          "image/png": geminiResult.blob,
        }),
      ]);
      toast.success("Clean image copied to clipboard!");
    } catch {
      toast.error("Clipboard copy not supported in this browser");
    }
  };

  const handleDownloadCleanGemini = () => {
    if (!geminiResult) return;
    downloadBlob(
      geminiResult.blob,
      `gemini_clean_${geminiFile?.name.replace(/\.[^/.]+$/, "") || "image"}.png`,
    );
    toast.success("Downloaded clean image!");
  };

  // =========================================================================
  // Image Magic Brush Handlers
  // =========================================================================
  const handleBrushFileSelect = (f: File) => {
    setBrushFile(f);
    const url = URL.createObjectURL(f);
    setBrushImageSrc(url);
    historyRef.current = [];

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (ctx) {
        ctx.drawImage(img, 0, 0);
        historyRef.current.push(
          ctx.getImageData(0, 0, canvas.width, canvas.height),
        );
      }
    };
    img.src = url;
  };

  const startDraw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    drawWatermarkErase(e);
  };

  const stopDraw = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (ctx) {
      historyRef.current.push(
        ctx.getImageData(0, 0, canvas.width, canvas.height),
      );
    }
  };

  const drawWatermarkErase = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing && e.type !== "mousedown") return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const x = Math.round((e.clientX - rect.left) * scaleX);
    const y = Math.round((e.clientY - rect.top) * scaleY);
    const radius = Math.round(brushSize * (scaleX || 1));

    inpaintCirclePatch(ctx, x, y, radius, canvas.width, canvas.height);
  };

  const inpaintCirclePatch = (
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    radius: number,
    width: number,
    height: number,
  ) => {
    const boxX = Math.max(0, cx - radius - 5);
    const boxY = Math.max(0, cy - radius - 5);
    const boxW = Math.min(width - boxX, (radius + 5) * 2);
    const boxH = Math.min(height - boxY, (radius + 5) * 2);
    if (boxW <= 0 || boxH <= 0) return;

    const imgData = ctx.getImageData(boxX, boxY, boxW, boxH);
    const data = imgData.data;

    let sumR = 0,
      sumG = 0,
      sumB = 0,
      count = 0;

    for (let py = 0; py < boxH; py++) {
      for (let px = 0; px < boxW; px++) {
        const dx = px + boxX - cx;
        const dy = py + boxY - cy;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist >= radius && dist <= radius + 4) {
          const idx = (py * boxW + px) * 4;
          sumR += data[idx];
          sumG += data[idx + 1];
          sumB += data[idx + 2];
          count++;
        }
      }
    }

    if (count === 0) return;
    const avgR = sumR / count;
    const avgG = sumG / count;
    const avgB = sumB / count;

    for (let py = 0; py < boxH; py++) {
      for (let px = 0; px < boxW; px++) {
        const dx = px + boxX - cx;
        const dy = py + boxY - cy;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist <= radius) {
          const idx = (py * boxW + px) * 4;
          const factor = Math.max(0, Math.min(1, 1 - dist / radius));
          data[idx] = Math.round(
            data[idx] * (1 - factor * 0.9) + avgR * factor * 0.9,
          );
          data[idx + 1] = Math.round(
            data[idx + 1] * (1 - factor * 0.9) + avgG * factor * 0.9,
          );
          data[idx + 2] = Math.round(
            data[idx + 2] * (1 - factor * 0.9) + avgB * factor * 0.9,
          );
        }
      }
    }

    ctx.putImageData(imgData, boxX, boxY);
  };

  const handleBrushUndo = () => {
    if (historyRef.current.length <= 1) return;
    historyRef.current.pop();
    const prev = historyRef.current[historyRef.current.length - 1];
    const canvas = canvasRef.current;
    if (canvas && prev) {
      const ctx = canvas.getContext("2d");
      if (ctx) ctx.putImageData(prev, 0, 0);
    }
  };

  const handleBrushReset = () => {
    if (historyRef.current.length > 0) {
      const original = historyRef.current[0];
      const canvas = canvasRef.current;
      if (canvas && original) {
        const ctx = canvas.getContext("2d");
        if (ctx) ctx.putImageData(original, 0, 0);
        historyRef.current = [original];
        toast.success("Image reset to original");
      }
    }
  };

  const handleBrushDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.toBlob((blob) => {
      if (blob) {
        downloadBlob(blob, `cleaned_${brushFile?.name || "image.png"}`);
        toast.success("Cleaned image downloaded!");
      }
    }, "image/png");
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-4xl font-bold">Gemini Watermark Remover</h1>
          </div>
          <p className="text-muted-foreground text-lg">
            100% Client-Side based on{" "}
            <a
              href="https://github.com/GargantuaX/gemini-watermark-remover"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline inline-flex items-center gap-1 font-semibold"
            >
              Gemini-watermark-remover <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </p>
        </div>
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-medium self-start md:self-auto">
          <ShieldCheck className="w-4 h-4" />
          <span>100% Client-Side • $0 Forever • Lossless</span>
        </div>
      </div>

      {/* Mode Selector Tabs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <button
          onClick={() => setActiveTab("gemini")}
          className={`flex items-center justify-center gap-2.5 p-4 rounded-2xl border transition-all font-semibold text-sm ${
            activeTab === "gemini"
              ? "bg-primary/10 border-primary shadow-lg shadow-primary/10 text-white scale-[1.02]"
              : "glass-card border-white/10 hover:border-white/20 text-muted-foreground"
          }`}
        >
          <Sparkles className="w-5 h-5 text-indigo-400" />
          <span>Gemini AI Watermark Remover</span>
        </button>

        <button
          onClick={() => setActiveTab("magic-brush")}
          className={`flex items-center justify-center gap-2.5 p-4 rounded-2xl border transition-all font-semibold text-sm ${
            activeTab === "magic-brush"
              ? "bg-primary/10 border-primary shadow-lg shadow-primary/10 text-white scale-[1.02]"
              : "glass-card border-white/10 hover:border-white/20 text-muted-foreground"
          }`}
        >
          <Paintbrush className="w-5 h-5 text-pink-400" />
          <span>Image Magic Inpainter</span>
        </button>
      </div>

      {/* Active Mode Workspace */}
      <div className="glass-card p-6 md:p-8 rounded-3xl border border-white/10 space-y-6">
        {/* ========================================================================= */}
        {/* 1. GEMINI AI WATERMARK REMOVER */}
        {/* ========================================================================= */}
        {activeTab === "gemini" && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-xl font-bold">
                  Reverse Alpha Blending Engine
                </h3>
                <p className="text-sm text-muted-foreground">
                  Mathematically inverts Gemini's semi-transparent watermark
                  logo without AI blurring or hallucination.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsBatchMode(!isBatchMode)}
                  className="px-3.5 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-semibold flex items-center gap-1.5"
                >
                  <Layers className="w-3.5 h-3.5 text-primary" />
                  <span>
                    {isBatchMode
                      ? "Switch to Single Mode"
                      : "Batch Multi-Image Mode"}
                  </span>
                </button>
              </div>
            </div>

            {/* Single Mode Upload / Result */}
            {!isBatchMode ? (
              !geminiPreview ? (
                <FileUpload
                  accept={{
                    "image/png": [".png"],
                    "image/jpeg": [".jpg", ".jpeg"],
                    "image/webp": [".webp"],
                  }}
                  multiple={false}
                  onDrop={(files) =>
                    files[0] && handleGeminiSingleSelect(files[0])
                  }
                  title="Drop a Gemini AI generated image here"
                  subtitle="PNG, JPG, WebP (processed 100% locally in browser memory)"
                />
              ) : (
                <div className="space-y-6">
                  {/* File info bar */}
                  <div className="flex flex-wrap items-center justify-between p-3.5 bg-white/5 rounded-2xl border border-white/10 gap-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/20 rounded-xl text-primary">
                        <ImageIcon className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-semibold text-sm truncate max-w-xs">
                          {geminiFile?.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {geminiResult
                            ? `${geminiResult.width} × ${geminiResult.height} px • Reverse Alpha Blending Applied`
                            : "Analyzing Gemini watermark..."}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setGeminiPreview(null);
                        setGeminiResult(null);
                        setGeminiFile(null);
                      }}
                      className="text-xs text-muted-foreground hover:text-white px-3 py-1.5 rounded-lg bg-white/5"
                    >
                      Change Image
                    </button>
                  </div>

                  {/* Interactive Before / After Split Slider */}
                  <div className="relative w-full h-[300px] sm:h-[400px] md:h-[480px] bg-black/60 rounded-2xl border border-white/10 overflow-hidden select-none">
                    {loading ? (
                      <div className="h-full flex flex-col items-center justify-center space-y-3 p-4">
                        <Loader2 className="w-10 h-10 animate-spin text-primary" />
                        <p className="font-semibold text-xs sm:text-sm text-center">
                          Computing Reverse Alpha Blending matrix...
                        </p>
                      </div>
                    ) : geminiResult ? (
                      <>
                        {/* Processed (After) Image */}
                        <img
                          src={geminiResult.dataUrl}
                          alt="Cleaned"
                          className="absolute inset-0 w-full h-full object-contain pointer-events-none"
                        />

                        {/* Original (Before) Image with clip-path */}
                        <div
                          style={{
                            clipPath: `polygon(0 0, ${sliderPosition}% 0, ${sliderPosition}% 100%, 0 100%)`,
                          }}
                          className="absolute inset-0 w-full h-full overflow-hidden"
                        >
                          <img
                            src={geminiPreview}
                            alt="Original with watermark"
                            className="absolute inset-0 w-full h-full object-contain pointer-events-none"
                          />
                        </div>

                        {/* Slider Divider Line */}
                        <div
                          style={{ left: `${sliderPosition}%` }}
                          className="absolute top-0 bottom-0 w-0.5 bg-white shadow-[0_0_10px_rgba(0,0,0,0.8)] pointer-events-none z-20 flex items-center justify-center"
                        >
                          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-primary border-2 border-white shadow-xl flex items-center justify-center text-white text-[10px] sm:text-xs font-bold -translate-x-1/2">
                            ↔
                          </div>
                        </div>

                        {/* Drag Range Input */}
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={sliderPosition}
                          onChange={(e) =>
                            setSliderPosition(parseInt(e.target.value))
                          }
                          className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize z-30"
                        />

                        {/* Labels */}
                        <div className="absolute top-3 left-3 sm:top-4 sm:left-4 px-2.5 py-1 bg-black/75 backdrop-blur-md rounded-lg text-[10px] sm:text-xs font-semibold text-white pointer-events-none border border-white/10">
                          Original
                        </div>
                        <div className="absolute top-3 right-3 sm:top-4 sm:right-4 px-2.5 py-1 bg-primary/85 backdrop-blur-md rounded-lg text-[10px] sm:text-xs font-semibold text-white pointer-events-none border border-primary/30">
                          Cleaned
                        </div>
                      </>
                    ) : null}
                  </div>

                  {/* Actions */}
                  {geminiResult && (
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
                      <div className="flex items-center gap-2 text-xs text-emerald-400 font-medium">
                        <CheckCircle2 className="w-4 h-4 shrink-0" />
                        <span>Lossless Reverse Alpha Blending Complete</span>
                      </div>

                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
                        <button
                          onClick={handleCopyCleanImage}
                          className="px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-center gap-2"
                        >
                          <Copy className="w-4 h-4" />
                          <span>Copy Image</span>
                        </button>
                        <button
                          onClick={handleDownloadCleanGemini}
                          className="btn-premium px-6 py-2.5 text-xs sm:text-sm flex items-center justify-center gap-2"
                        >
                          <Download className="w-4 h-4" />
                          <span>Download PNG</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )
            ) : (
              /* Batch Mode */
              <div className="space-y-6">
                <FileUpload
                  accept={{
                    "image/png": [".png"],
                    "image/jpeg": [".jpg", ".jpeg"],
                    "image/webp": [".webp"],
                  }}
                  multiple={true}
                  onDrop={(files) => handleGeminiBatchSelect(files)}
                  title="Drop multiple Gemini images for batch removal"
                  subtitle="Upload multiple images to process all watermarks in parallel"
                />

                {batchItems.length > 0 && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold">
                        Batch Progress (
                        {batchItems.filter((i) => i.status === "done").length}/
                        {batchItems.length})
                      </span>
                      <button
                        onClick={() => {
                          batchItems.forEach((item) => {
                            if (item.result) {
                              downloadBlob(
                                item.result.blob,
                                `clean_${item.file.name.replace(/\.[^/.]+$/, "")}.png`,
                              );
                            }
                          });
                          toast.success("Downloaded all cleaned images!");
                        }}
                        disabled={batchItems.every((i) => i.status !== "done")}
                        className="btn-premium px-4 py-2 text-xs flex items-center gap-1.5 disabled:opacity-40"
                      >
                        <Download className="w-3.5 h-3.5" /> Download All
                      </button>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                      {batchItems.map((item, idx) => (
                        <div
                          key={idx}
                          className="glass-card p-2.5 rounded-xl border border-white/10 text-center relative group space-y-1.5"
                        >
                          <div className="w-full aspect-square bg-black/40 rounded-lg overflow-hidden flex items-center justify-center relative">
                            <img
                              src={
                                item.result
                                  ? item.result.dataUrl
                                  : item.previewUrl
                              }
                              alt="Batch item"
                              className="w-full h-full object-cover"
                            />
                            {item.status === "processing" && (
                              <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                                <Loader2 className="w-6 h-6 animate-spin text-primary" />
                              </div>
                            )}
                            {item.status === "done" && (
                              <div className="absolute top-1 right-1 p-1 bg-emerald-500 rounded-full text-white">
                                <CheckCircle2 className="w-3 h-3" />
                              </div>
                            )}
                          </div>
                          <p className="text-[11px] font-medium truncate">
                            {item.file.name}
                          </p>
                          {item.result && (
                            <button
                              onClick={() =>
                                downloadBlob(
                                  item.result!.blob,
                                  `clean_${item.file.name.replace(/\.[^/.]+$/, "")}.png`,
                                )
                              }
                              className="text-[10px] text-primary hover:underline block w-full"
                            >
                              Download
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* 2. IMAGE MAGIC BRUSH INPAINTER */}
        {/* ========================================================================= */}
        {activeTab === "magic-brush" && (
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-bold">
                General Image Watermark Inpainter
              </h3>
              <p className="text-sm text-muted-foreground">
                Paint over any non-Gemini watermark logo, text, or blemish on
                your image to erase it with surrounding texture.
              </p>
            </div>

            {!brushImageSrc ? (
              <FileUpload
                accept={{
                  "image/png": [".png"],
                  "image/jpeg": [".jpg", ".jpeg"],
                  "image/webp": [".webp"],
                }}
                multiple={false}
                onDrop={(files) => files[0] && handleBrushFileSelect(files[0])}
                title="Upload an image to erase custom watermarks"
                subtitle="Supports PNG, JPG, WebP"
              />
            ) : (
              <div className="space-y-6">
                <div className="flex flex-wrap items-center justify-between p-3.5 bg-white/5 rounded-2xl border border-white/10 gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <Paintbrush className="w-4 h-4 text-primary" />
                      <span className="text-xs font-semibold text-muted-foreground uppercase">
                        Brush: {brushSize}px
                      </span>
                    </div>
                    <input
                      type="range"
                      min="5"
                      max="60"
                      value={brushSize}
                      onChange={(e) => setBrushSize(parseInt(e.target.value))}
                      className="w-32 accent-primary"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleBrushUndo}
                      className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs"
                    >
                      Undo
                    </button>
                    <button
                      onClick={handleBrushReset}
                      className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs flex items-center gap-1"
                    >
                      <RefreshCw className="w-3.5 h-3.5" /> Reset
                    </button>
                    <button
                      onClick={() => {
                        setBrushImageSrc(null);
                        setBrushFile(null);
                      }}
                      className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs text-muted-foreground hover:text-white"
                    >
                      Change Image
                    </button>
                  </div>
                </div>

                <div className="relative flex flex-col items-center justify-center p-4 bg-black/40 rounded-2xl border border-white/10 overflow-hidden min-h-[380px]">
                  <canvas
                    ref={canvasRef}
                    onMouseDown={startDraw}
                    onMouseUp={stopDraw}
                    onMouseMove={drawWatermarkErase}
                    onMouseLeave={stopDraw}
                    className="max-h-[460px] max-w-full w-auto object-contain cursor-crosshair rounded-lg shadow-2xl"
                  />
                  <p className="text-xs text-muted-foreground mt-3">
                    💡 Click and drag over watermark text or logos to erase them
                    seamlessly.
                  </p>
                </div>

                <button
                  onClick={handleBrushDownload}
                  className="btn-premium w-full py-4 flex items-center justify-center gap-2"
                >
                  <Download className="w-5 h-5" />
                  <span>Download Cleaned Image</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
