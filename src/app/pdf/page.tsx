'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText,
  Merge,
  Scissors,
  Layers,
  Image as ImageIcon,
  Edit3,
  Download,
  Loader2,
  Trash2,
  ArrowUp,
  ArrowDown,
  Plus,
  ShieldCheck,
  Zap,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';
import FileUpload from '@/components/FileUpload';
import { downloadBlob, formatFileSize } from '@/lib/utils';
import {
  mergePdfs,
  splitPdf,
  reorderAndRemovePages,
  convertImagesToPdf,
  stampPdfText,
  getPdfPageCount,
} from '@/lib/clientPdf';
import toast from 'react-hot-toast';

type Tool = 'merge' | 'split' | 'reorder' | 'image-to-pdf' | 'annotate';

export default function PDFPage() {
  const [activeTool, setActiveTool] = useState<Tool>('merge');
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  // Merge State
  const [mergeFiles, setMergeFiles] = useState<File[]>([]);

  // Split State
  const [splitFile, setSplitFile] = useState<File | null>(null);
  const [splitTotalPages, setSplitTotalPages] = useState<number>(0);
  const [splitRanges, setSplitRanges] = useState('1');

  // Reorder & Remove State
  const [reorderFile, setReorderFile] = useState<File | null>(null);
  const [reorderTotalPages, setReorderTotalPages] = useState<number>(0);
  const [pageOrder, setPageOrder] = useState<number[]>([]); // 0-indexed

  // Image to PDF State
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [pageSizeOption, setPageSizeOption] = useState<'fit' | 'A4'>('fit');

  // Annotate / Edit PDF State
  const [annotateFile, setAnnotateFile] = useState<File | null>(null);
  const [annotateTotalPages, setAnnotateTotalPages] = useState<number>(0);
  const [stampText, setStampText] = useState('CONFIDENTIAL');
  const [stampPageOption, setStampPageOption] = useState<'all' | 'custom'>('all');
  const [stampCustomPages, setStampCustomPages] = useState('1');
  const [stampPosition, setStampPosition] = useState<'center' | 'header' | 'footer' | 'custom'>('center');
  const [stampFontSize, setStampFontSize] = useState(28);
  const [stampColor, setStampColor] = useState('#6366f1');
  const [stampOpacity, setStampOpacity] = useState(0.8);
  const [stampCustomX, setStampCustomX] = useState(100);
  const [stampCustomY, setStampCustomY] = useState(200);

  const tools = [
    {
      id: 'merge' as Tool,
      name: 'Merge PDFs',
      icon: Merge,
      description: 'Combine multiple PDF documents into one instant file',
      badge: '0$ In-Browser',
    },
    {
      id: 'split' as Tool,
      name: 'Split PDF',
      icon: Scissors,
      description: 'Extract specific page numbers or custom ranges',
      badge: '0$ In-Browser',
    },
    {
      id: 'reorder' as Tool,
      name: 'Remove / Reorder Pages',
      icon: Layers,
      description: 'Rearrange page sequence or delete unwanted pages',
      badge: '0$ In-Browser',
    },
    {
      id: 'image-to-pdf' as Tool,
      name: 'Convert Image to PDF',
      icon: ImageIcon,
      description: 'Turn PNG, JPG, WebP images into clean PDF documents',
      badge: '0$ In-Browser',
    },
    {
      id: 'annotate' as Tool,
      name: 'Edit PDF (Add Text)',
      icon: Edit3,
      description: 'Stamp custom text, annotations, watermarks & headers',
      badge: '0$ In-Browser',
    },
  ];

  // Merge Handlers
  const handleAddMergeFiles = (newFiles: File[]) => {
    setMergeFiles((prev) => [...prev, ...newFiles]);
  };

  const removeMergeFile = (index: number) => {
    setMergeFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const moveMergeFile = (index: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= mergeFiles.length) return;
    const updated = [...mergeFiles];
    const temp = updated[index];
    updated[index] = updated[targetIdx];
    updated[targetIdx] = temp;
    setMergeFiles(updated);
  };

  const handleExecuteMerge = async () => {
    if (mergeFiles.length < 2) {
      toast.error('Please upload at least 2 PDF files to merge');
      return;
    }

    setLoading(true);
    setProgress(0);

    try {
      const mergedBytes = await mergePdfs(mergeFiles, (pct) => setProgress(pct));
      const blob = new Blob([new Uint8Array(mergedBytes)], { type: 'application/pdf' });
      downloadBlob(blob, 'toolnest_merged.pdf');
      toast.success('PDFs merged successfully in-browser!');
    } catch (err: any) {
      toast.error(err.message || 'Failed to merge PDFs');
    } finally {
      setLoading(false);
      setProgress(0);
    }
  };

  // Split Handlers
  const handleSplitFileSelect = async (f: File) => {
    setSplitFile(f);
    try {
      const count = await getPdfPageCount(f);
      setSplitTotalPages(count);
      setSplitRanges(`1-${Math.min(count, 3)}`);
    } catch {
      toast.error('Could not read PDF metadata');
    }
  };

  const handleExecuteSplit = async () => {
    if (!splitFile) {
      toast.error('Please select a PDF file');
      return;
    }
    if (!splitRanges.trim()) {
      toast.error('Please enter a valid page range');
      return;
    }

    setLoading(true);
    setProgress(0);

    try {
      const splitBytes = await splitPdf(splitFile, splitRanges, (pct) => setProgress(pct));
      const blob = new Blob([new Uint8Array(splitBytes)], { type: 'application/pdf' });
      downloadBlob(blob, `${splitFile.name.replace(/\.[^/.]+$/, '')}_pages_${splitRanges}.pdf`);
      toast.success('PDF split successfully!');
    } catch (err: any) {
      toast.error(err.message || 'Failed to split PDF');
    } finally {
      setLoading(false);
      setProgress(0);
    }
  };

  // Reorder & Remove Handlers
  const handleReorderFileSelect = async (f: File) => {
    setReorderFile(f);
    try {
      const count = await getPdfPageCount(f);
      setReorderTotalPages(count);
      setPageOrder(Array.from({ length: count }, (_, i) => i));
    } catch {
      toast.error('Could not inspect PDF pages');
    }
  };

  const movePage = (index: number, direction: 'left' | 'right') => {
    const targetIdx = direction === 'left' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= pageOrder.length) return;
    const updated = [...pageOrder];
    const temp = updated[index];
    updated[index] = updated[targetIdx];
    updated[targetIdx] = temp;
    setPageOrder(updated);
  };

  const deletePage = (index: number) => {
    if (pageOrder.length <= 1) {
      toast.error('PDF must have at least 1 page');
      return;
    }
    setPageOrder((prev) => prev.filter((_, i) => i !== index));
  };

  const resetPageOrder = () => {
    if (reorderTotalPages > 0) {
      setPageOrder(Array.from({ length: reorderTotalPages }, (_, i) => i));
      toast.success('Page order reset');
    }
  };

  const handleExecuteReorder = async () => {
    if (!reorderFile) {
      toast.error('Please select a PDF file');
      return;
    }
    if (pageOrder.length === 0) {
      toast.error('Please keep at least one page');
      return;
    }

    setLoading(true);
    setProgress(0);

    try {
      const newPdfBytes = await reorderAndRemovePages(reorderFile, pageOrder, (pct) =>
        setProgress(pct)
      );
      const blob = new Blob([new Uint8Array(newPdfBytes)], { type: 'application/pdf' });
      downloadBlob(blob, `${reorderFile.name.replace(/\.[^/.]+$/, '')}_reordered.pdf`);
      toast.success('Reorganized PDF downloaded!');
    } catch (err: any) {
      toast.error(err.message || 'Failed to reorder PDF');
    } finally {
      setLoading(false);
      setProgress(0);
    }
  };

  // Convert Image to PDF Handlers
  const handleAddImageFiles = (newFiles: File[]) => {
    setImageFiles((prev) => [...prev, ...newFiles]);
  };

  const removeImageFile = (index: number) => {
    setImageFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleExecuteImageToPdf = async () => {
    if (imageFiles.length === 0) {
      toast.error('Please upload at least 1 image');
      return;
    }

    setLoading(true);
    setProgress(0);

    try {
      const pdfBytes = await convertImagesToPdf(
        imageFiles,
        { pageSize: pageSizeOption },
        (pct) => setProgress(pct)
      );
      const blob = new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' });
      downloadBlob(blob, 'images_converted.pdf');
      toast.success('Images converted to PDF successfully!');
    } catch (err: any) {
      toast.error(err.message || 'Failed to convert images to PDF');
    } finally {
      setLoading(false);
      setProgress(0);
    }
  };

  // Annotate / Stamp PDF Handlers
  const handleAnnotateFileSelect = async (f: File) => {
    setAnnotateFile(f);
    try {
      const count = await getPdfPageCount(f);
      setAnnotateTotalPages(count);
    } catch {
      toast.error('Could not read PDF file');
    }
  };

  const handleExecuteAnnotate = async () => {
    if (!annotateFile) {
      toast.error('Please select a PDF file');
      return;
    }
    if (!stampText.trim()) {
      toast.error('Please enter text to stamp');
      return;
    }

    setLoading(true);
    setProgress(0);

    try {
      const stampedBytes = await stampPdfText(
        annotateFile,
        {
          text: stampText,
          pageOption: stampPageOption,
          customPages: stampCustomPages,
          position: stampPosition,
          fontSize: stampFontSize,
          colorHex: stampColor,
          opacity: stampOpacity,
          customX: stampCustomX,
          customY: stampCustomY,
        },
        (pct) => setProgress(pct)
      );
      const blob = new Blob([new Uint8Array(stampedBytes)], { type: 'application/pdf' });
      downloadBlob(blob, `${annotateFile.name.replace(/\.[^/.]+$/, '')}_annotated.pdf`);
      toast.success('PDF text stamped & exported!');
    } catch (err: any) {
      toast.error(err.message || 'Failed to stamp text on PDF');
    } finally {
      setLoading(false);
      setProgress(0);
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header with 100% Client-Side / $0 Cost Badge */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-1 text-white">PDF Tools Suite</h1>
          <p className="text-muted-foreground text-xs sm:text-sm md:text-base">
            Merge, split, reorder, stamp, and convert PDFs directly inside your browser.
          </p>
        </div>
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold self-start md:self-auto">
          <ShieldCheck className="w-4 h-4 shrink-0" />
          <span>100% Client-Side • $0 Forever • Complete Privacy</span>
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

      {/* Active Tool Workspace */}
      <div className="glass-card p-4 sm:p-6 md:p-8 rounded-3xl border border-white/10 space-y-6">
        {/* ========================================================= */}
        {/* 1. MERGE PDFS */}
        {/* ========================================================= */}
        {activeTool === 'merge' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold">Merge PDF Documents</h3>
                <p className="text-sm text-muted-foreground">
                  Upload multiple PDFs, reorder if desired, and combine them into a single file in memory.
                </p>
              </div>
            </div>

            <FileUpload
              accept={{ 'application/pdf': ['.pdf'] }}
              multiple={true}
              onDrop={(files) => handleAddMergeFiles(files)}
              title="Drag & drop PDF files to merge"
              subtitle="Upload 2 or more PDF documents (processed 100% in browser memory)"
            />

            {mergeFiles.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                    Files to Merge ({mergeFiles.length})
                  </h4>
                  <button
                    onClick={() => setMergeFiles([])}
                    className="text-xs text-red-400 hover:underline"
                  >
                    Clear All
                  </button>
                </div>

                <div className="space-y-2">
                  {mergeFiles.map((f, idx) => (
                    <motion.div
                      key={`${f.name}-${idx}`}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center justify-between p-3.5 bg-white/5 rounded-xl border border-white/10"
                    >
                      <div className="flex items-center gap-3 truncate">
                        <span className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold shrink-0">
                          {idx + 1}
                        </span>
                        <div className="truncate">
                          <p className="font-medium text-sm truncate">{f.name}</p>
                          <p className="text-xs text-muted-foreground">{formatFileSize(f.size)}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0 ml-3">
                        <button
                          disabled={idx === 0}
                          onClick={() => moveMergeFile(idx, 'up')}
                          className="p-1.5 rounded-lg hover:bg-white/10 disabled:opacity-30"
                          title="Move up"
                        >
                          <ArrowUp className="w-4 h-4" />
                        </button>
                        <button
                          disabled={idx === mergeFiles.length - 1}
                          onClick={() => moveMergeFile(idx, 'down')}
                          className="p-1.5 rounded-lg hover:bg-white/10 disabled:opacity-30"
                          title="Move down"
                        >
                          <ArrowDown className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => removeMergeFile(idx)}
                          className="p-1.5 rounded-lg hover:bg-red-500/20 text-red-400"
                          title="Remove file"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>

                <button
                  disabled={loading || mergeFiles.length < 2}
                  onClick={handleExecuteMerge}
                  className="btn-premium w-full py-4 flex items-center justify-center gap-2 mt-4"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Merging PDFs ({progress}%)...</span>
                    </>
                  ) : (
                    <>
                      <Merge className="w-5 h-5" />
                      <span>Merge {mergeFiles.length} PDFs Now</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* 2. SPLIT PDF */}
        {/* ========================================================= */}
        {activeTool === 'split' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-bold">Split PDF Pages</h3>
              <p className="text-sm text-muted-foreground">
                Extract individual pages or page ranges into a separate new PDF document.
              </p>
            </div>

            {!splitFile ? (
              <FileUpload
                accept={{ 'application/pdf': ['.pdf'] }}
                multiple={false}
                onDrop={(files) => files[0] && handleSplitFileSelect(files[0])}
                title="Select a PDF file to split"
              />
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-primary/20 rounded-xl text-primary">
                      <FileText className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="font-semibold">{splitFile.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatFileSize(splitFile.size)} • Total Pages: {splitTotalPages || '...'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setSplitFile(null);
                      setSplitTotalPages(0);
                    }}
                    className="text-xs text-muted-foreground hover:text-white"
                  >
                    Change File
                  </button>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Page Ranges to Extract</label>
                  <input
                    type="text"
                    value={splitRanges}
                    onChange={(e) => setSplitRanges(e.target.value)}
                    placeholder="e.g. 1-3, 5, 7-9"
                    className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-xl focus:border-primary focus:outline-none text-white font-mono"
                  />
                  <p className="text-xs text-muted-foreground">
                    Example: `1-3, 5` extracts pages 1, 2, 3, and 5 (Total available: {splitTotalPages})
                  </p>
                </div>

                <button
                  disabled={loading || !splitRanges.trim()}
                  onClick={handleExecuteSplit}
                  className="btn-premium w-full py-4 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Extracting Pages...</span>
                    </>
                  ) : (
                    <>
                      <Scissors className="w-5 h-5" />
                      <span>Extract & Download Pages</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* 3. REMOVE & REORDER PAGES */}
        {/* ========================================================= */}
        {activeTool === 'reorder' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-bold">Remove & Reorder PDF Pages</h3>
              <p className="text-sm text-muted-foreground">
                Delete unwanted pages or rearrange page sequence with instant visual control.
              </p>
            </div>

            {!reorderFile ? (
              <FileUpload
                accept={{ 'application/pdf': ['.pdf'] }}
                multiple={false}
                onDrop={(files) => files[0] && handleReorderFileSelect(files[0])}
                title="Select a PDF to manage pages"
              />
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10">
                  <div>
                    <p className="font-semibold">{reorderFile.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Original: {reorderTotalPages} pages • Selected: {pageOrder.length} pages
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={resetPageOrder}
                      className="px-3 py-1.5 text-xs bg-white/5 hover:bg-white/10 rounded-lg flex items-center gap-1"
                    >
                      <RefreshCw className="w-3 h-3" /> Reset
                    </button>
                    <button
                      onClick={() => {
                        setReorderFile(null);
                        setPageOrder([]);
                      }}
                      className="px-3 py-1.5 text-xs text-muted-foreground hover:text-white"
                    >
                      Change File
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                  {pageOrder.map((pageIdx, displayIdx) => (
                    <motion.div
                      key={`${pageIdx}-${displayIdx}`}
                      layout
                      className="glass-card p-3 rounded-xl border border-white/10 flex flex-col items-center justify-between text-center relative group"
                    >
                      <div className="w-full aspect-[3/4] bg-white/5 rounded-lg flex flex-col items-center justify-center border border-dashed border-white/10 mb-2">
                        <FileText className="w-8 h-8 text-primary/70 mb-1" />
                        <span className="text-xs font-bold text-white">Page {pageIdx + 1}</span>
                      </div>

                      <div className="w-full flex items-center justify-between text-xs pt-1 border-t border-white/10">
                        <button
                          disabled={displayIdx === 0}
                          onClick={() => movePage(displayIdx, 'left')}
                          className="p-1 rounded hover:bg-white/10 disabled:opacity-20"
                          title="Move left"
                        >
                          ←
                        </button>
                        <span className="text-[10px] text-muted-foreground font-mono">
                          #{displayIdx + 1}
                        </span>
                        <button
                          disabled={displayIdx === pageOrder.length - 1}
                          onClick={() => movePage(displayIdx, 'right')}
                          className="p-1 rounded hover:bg-white/10 disabled:opacity-20"
                          title="Move right"
                        >
                          →
                        </button>
                        <button
                          onClick={() => deletePage(displayIdx)}
                          className="p-1 rounded text-red-400 hover:bg-red-500/20 ml-1"
                          title="Delete page"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>

                <button
                  disabled={loading || pageOrder.length === 0}
                  onClick={handleExecuteReorder}
                  className="btn-premium w-full py-4 flex items-center justify-center gap-2 mt-4"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Generating PDF...</span>
                    </>
                  ) : (
                    <>
                      <Layers className="w-5 h-5" />
                      <span>Save & Download Reorganized PDF ({pageOrder.length} Pages)</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* 4. CONVERT IMAGE TO PDF */}
        {/* ========================================================= */}
        {activeTool === 'image-to-pdf' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-bold">Convert Images to PDF</h3>
              <p className="text-sm text-muted-foreground">
                Convert PNG, JPG, or WebP images into a high-quality single or multi-page PDF document.
              </p>
            </div>

            <FileUpload
              accept={{
                'image/png': ['.png'],
                'image/jpeg': ['.jpg', '.jpeg'],
                'image/webp': ['.webp'],
              }}
              multiple={true}
              onDrop={(files) => handleAddImageFiles(files)}
              title="Upload images (PNG, JPG, WebP)"
              subtitle="Batch upload images to combine into a single PDF document"
            />

            {imageFiles.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold">Images Selected ({imageFiles.length})</span>
                  <div className="flex items-center gap-3">
                    <label className="text-xs text-muted-foreground">Page Size:</label>
                    <select
                      value={pageSizeOption}
                      onChange={(e) => setPageSizeOption(e.target.value as any)}
                      className="bg-black/40 border border-white/10 text-xs px-2.5 py-1.5 rounded-lg text-white"
                    >
                      <option value="fit">Fit to Image Size</option>
                      <option value="A4">Standard A4 Page</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
                  {imageFiles.map((file, idx) => (
                    <div
                      key={`${file.name}-${idx}`}
                      className="glass-card p-2 rounded-xl border border-white/10 relative group text-center"
                    >
                      <div className="w-full aspect-square bg-white/5 rounded-lg flex items-center justify-center overflow-hidden mb-1">
                        <img
                          src={URL.createObjectURL(file)}
                          alt="preview"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <p className="text-[11px] truncate font-medium">{file.name}</p>
                      <button
                        onClick={() => removeImageFile(idx)}
                        className="absolute top-1 right-1 p-1 bg-red-500/80 hover:bg-red-500 text-white rounded-md opacity-0 group-hover:opacity-100 transition"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>

                <button
                  disabled={loading || imageFiles.length === 0}
                  onClick={handleExecuteImageToPdf}
                  className="btn-premium w-full py-4 flex items-center justify-center gap-2 mt-4"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Converting Images to PDF...</span>
                    </>
                  ) : (
                    <>
                      <ImageIcon className="w-5 h-5" />
                      <span>Convert {imageFiles.length} Images to PDF</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* 5. EDIT & ANNOTATE PDF */}
        {/* ========================================================= */}
        {activeTool === 'annotate' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-bold">Edit PDF & Add Text / Watermarks</h3>
              <p className="text-sm text-muted-foreground">
                Stamp custom text, annotations, headers, or watermarks directly onto pages client-side.
              </p>
            </div>

            {!annotateFile ? (
              <FileUpload
                accept={{ 'application/pdf': ['.pdf'] }}
                multiple={false}
                onDrop={(files) => files[0] && handleAnnotateFileSelect(files[0])}
                title="Select a PDF file to annotate"
              />
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-primary/20 rounded-xl text-primary">
                      <FileText className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="font-semibold">{annotateFile.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Total Pages: {annotateTotalPages || '...'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setAnnotateFile(null);
                      setAnnotateTotalPages(0);
                    }}
                    className="text-xs text-muted-foreground hover:text-white"
                  >
                    Change File
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground uppercase">
                      Stamp / Annotation Text
                    </label>
                    <input
                      type="text"
                      value={stampText}
                      onChange={(e) => setStampText(e.target.value)}
                      placeholder="e.g. CONFIDENTIAL, DRAFT, APPROVED"
                      className="w-full mt-1.5 px-4 py-2.5 bg-black/20 border border-white/10 rounded-xl text-sm focus:border-primary focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-muted-foreground uppercase">
                      Position Preset
                    </label>
                    <select
                      value={stampPosition}
                      onChange={(e) => setStampPosition(e.target.value as any)}
                      className="w-full mt-1.5 px-4 py-2.5 bg-black/40 border border-white/10 rounded-xl text-sm focus:border-primary focus:outline-none text-white"
                    >
                      <option value="center">Center of Page</option>
                      <option value="header">Header (Top Center)</option>
                      <option value="footer">Footer (Bottom Center)</option>
                      <option value="custom">Custom (X, Y Coordinates)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-muted-foreground uppercase">
                      Apply to Pages
                    </label>
                    <select
                      value={stampPageOption}
                      onChange={(e) => setStampPageOption(e.target.value as any)}
                      className="w-full mt-1.5 px-4 py-2.5 bg-black/40 border border-white/10 rounded-xl text-sm focus:border-primary focus:outline-none text-white"
                    >
                      <option value="all">All Pages ({annotateTotalPages})</option>
                      <option value="custom">Custom Page Range</option>
                    </select>
                  </div>

                  {stampPageOption === 'custom' && (
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground uppercase">
                        Page Numbers (e.g. 1, 3, 5)
                      </label>
                      <input
                        type="text"
                        value={stampCustomPages}
                        onChange={(e) => setStampCustomPages(e.target.value)}
                        placeholder="e.g. 1-2, 4"
                        className="w-full mt-1.5 px-4 py-2.5 bg-black/20 border border-white/10 rounded-xl text-sm focus:border-primary focus:outline-none"
                      />
                    </div>
                  )}

                  {stampPosition === 'custom' && (
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <label className="text-xs font-semibold text-muted-foreground uppercase">
                          X (pt)
                        </label>
                        <input
                          type="number"
                          value={stampCustomX}
                          onChange={(e) => setStampCustomX(parseInt(e.target.value) || 0)}
                          className="w-full mt-1.5 px-3 py-2 bg-black/20 border border-white/10 rounded-xl text-sm"
                        />
                      </div>
                      <div className="flex-1">
                        <label className="text-xs font-semibold text-muted-foreground uppercase">
                          Y (pt)
                        </label>
                        <input
                          type="number"
                          value={stampCustomY}
                          onChange={(e) => setStampCustomY(parseInt(e.target.value) || 0)}
                          className="w-full mt-1.5 px-3 py-2 bg-black/20 border border-white/10 rounded-xl text-sm"
                        />
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="text-xs font-semibold text-muted-foreground uppercase">
                      Font Size ({stampFontSize}pt)
                    </label>
                    <input
                      type="range"
                      min="12"
                      max="72"
                      value={stampFontSize}
                      onChange={(e) => setStampFontSize(parseInt(e.target.value))}
                      className="w-full mt-2 accent-primary"
                    />
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <label className="text-xs font-semibold text-muted-foreground uppercase">
                        Text Color
                      </label>
                      <div className="flex items-center gap-2 mt-1.5">
                        <input
                          type="color"
                          value={stampColor}
                          onChange={(e) => setStampColor(e.target.value)}
                          className="w-10 h-10 rounded-lg cursor-pointer bg-transparent border-0"
                        />
                        <span className="text-xs font-mono text-muted-foreground uppercase">
                          {stampColor}
                        </span>
                      </div>
                    </div>

                    <div className="flex-1">
                      <label className="text-xs font-semibold text-muted-foreground uppercase">
                        Opacity ({Math.round(stampOpacity * 100)}%)
                      </label>
                      <input
                        type="range"
                        min="0.1"
                        max="1.0"
                        step="0.05"
                        value={stampOpacity}
                        onChange={(e) => setStampOpacity(parseFloat(e.target.value))}
                        className="w-full mt-2 accent-primary"
                      />
                    </div>
                  </div>
                </div>

                <button
                  disabled={loading || !stampText.trim()}
                  onClick={handleExecuteAnnotate}
                  className="btn-premium w-full py-4 flex items-center justify-center gap-2 mt-4"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Stamping PDF ({progress}%)...</span>
                    </>
                  ) : (
                    <>
                      <Edit3 className="w-5 h-5" />
                      <span>Stamp & Export PDF</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
