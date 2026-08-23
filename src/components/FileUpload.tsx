'use client';

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion } from 'framer-motion';
import { Upload, File, X, CheckCircle2, AlertCircle } from 'lucide-react';
import { cn, formatFileSize, truncateFileName } from '@/lib/utils';

export interface FileUploadProps {
  onFileSelect?: (file: File) => void;
  onFilesSelect?: (files: File[]) => void;
  onDrop?: (files: File[]) => void;
  accept?: Record<string, string[]>;
  maxSize?: number;
  multiple?: boolean;
  disabled?: boolean;
  title?: string;
  subtitle?: string;
  className?: string;
}

export default function FileUpload({
  onFileSelect,
  onFilesSelect,
  onDrop: customOnDrop,
  accept,
  maxSize = 100 * 1024 * 1024, // 100MB
  multiple = false,
  disabled = false,
  title,
  subtitle,
  className,
}: FileUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string>('');

  const onDrop = useCallback(
    (acceptedFiles: File[], rejectedFiles: any[]) => {
      setError('');

      if (rejectedFiles.length > 0) {
        const rejection = rejectedFiles[0];
        if (rejection.errors[0]?.code === 'file-too-large') {
          setError(`File is too large. Maximum size is ${formatFileSize(maxSize)}`);
        } else if (rejection.errors[0]?.code === 'file-invalid-type') {
          setError('File type not supported');
        } else {
          setError('Invalid file');
        }
        return;
      }

      if (acceptedFiles.length > 0) {
        if (customOnDrop) {
          customOnDrop(acceptedFiles);
        }
        if (onFilesSelect) {
          onFilesSelect(acceptedFiles);
        }
        if (onFileSelect) {
          onFileSelect(acceptedFiles[0]);
        }
        if (!multiple) {
          setSelectedFile(acceptedFiles[0]);
        }
      }
    },
    [accept, maxSize, multiple, onFileSelect, onFilesSelect, customOnDrop]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept,
    maxSize,
    multiple,
    disabled,
  });

  const clearFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedFile(null);
    setError('');
  };

  return (
    <div className={cn('w-full', className)}>
      {!selectedFile || multiple ? (
        <div
          {...getRootProps()}
          className={cn(
            'upload-zone cursor-pointer p-6 sm:p-10 md:p-12 rounded-3xl border-2 border-dashed transition-all flex flex-col items-center justify-center text-center select-none',
            isDragActive
              ? 'border-primary bg-primary/10 shadow-lg shadow-primary/10 scale-[1.01]'
              : 'border-white/15 hover:border-white/35 bg-white/[0.03] hover:bg-white/[0.06]',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
        >
          <input {...getInputProps()} />

          <motion.div
            animate={isDragActive ? { scale: 1.03 } : { scale: 1 }}
            className="flex flex-col items-center gap-3 sm:gap-4 max-w-md mx-auto"
          >
            <div className="relative">
              <div
                className={cn(
                  'w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center',
                  'bg-gradient-to-br from-indigo-500/20 to-purple-500/20',
                  'border border-white/20',
                  isDragActive ? 'border-primary' : 'border-white/20'
                )}
              >
                <Upload
                  className={cn(
                    'w-7 h-7 sm:w-8 sm:h-8',
                    isDragActive ? 'text-primary' : 'text-muted-foreground'
                  )}
                />
              </div>
              {isDragActive && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -inset-2 bg-primary/25 rounded-2xl -z-10 blur-xl"
                />
              )}
            </div>

            <div className="text-center space-y-1 sm:space-y-1.5 px-2">
              <p className="text-base sm:text-lg font-bold text-white">
                {isDragActive
                  ? 'Drop files here'
                  : title || (multiple ? 'Drop files or tap to select' : 'Drop file or tap to upload')}
              </p>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                {subtitle || (accept ? `Supported: ${Object.keys(accept).join(', ')}` : 'Any file type')}
              </p>
              <p className="text-[11px] sm:text-xs text-muted-foreground/80 font-mono">
                100% In-Browser • Max: {formatFileSize(maxSize)}
              </p>
            </div>

            <button
              type="button"
              className="btn-premium text-xs sm:text-sm px-6 py-2.5 mt-1 pointer-events-none"
              disabled={disabled}
            >
              Browse Files
            </button>
          </motion.div>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-card p-4 sm:p-5 rounded-2xl border border-white/10"
        >
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
              <File className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
            </div>

            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm truncate">{truncateFileName(selectedFile.name, 35)}</p>
              <p className="text-xs text-muted-foreground">{formatFileSize(selectedFile.size)}</p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <button
                onClick={clearFile}
                className="p-1.5 hover:bg-white/10 rounded-lg text-muted-foreground hover:text-white transition-colors"
                aria-label="Remove file"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-3 p-3 sm:p-4 rounded-xl border border-red-500/30 bg-red-500/10"
        >
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-xs sm:text-sm text-red-400">Upload Notice</p>
              <p className="text-xs text-red-300 mt-0.5">{error}</p>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
