'use client';

import { useCallback } from 'react';
import { useDropzone, FileRejection, Accept } from 'react-dropzone';
import { cn } from '@/utils/helpers';

export interface FileUploadProps {
  onFilesSelected: (files: File[]) => void;
  onError?: (errors: string[]) => void;
  accept?: Accept;
  maxFiles?: number;
  maxSize?: number;
  multiple?: boolean;
  disabled?: boolean;
  className?: string;
  children?: React.ReactNode;
}

export default function FileUpload({
  onFilesSelected,
  onError,
  accept,
  maxFiles = 1,
  maxSize = 5 * 1024 * 1024, // 5MB
  multiple = false,
  disabled = false,
  className,
  children,
}: FileUploadProps) {
  const onDrop = useCallback(
    (acceptedFiles: File[], fileRejections: FileRejection[]) => {
      if (acceptedFiles.length > 0) {
        onFilesSelected(acceptedFiles);
      }

      if (fileRejections.length > 0 && onError) {
        const errors = fileRejections.flatMap((rejection) =>
          rejection.errors.map((error) => {
            switch (error.code) {
              case 'file-too-large':
                return `File "${rejection.file.name}" is too large. Max size is ${formatBytes(maxSize)}.`;
              case 'file-invalid-type':
                return `File "${rejection.file.name}" has an invalid type.`;
              case 'too-many-files':
                return `Too many files. Max is ${maxFiles}.`;
              default:
                return error.message;
            }
          })
        );
        onError(errors);
      }
    },
    [onFilesSelected, onError, maxSize, maxFiles]
  );

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept,
    maxFiles,
    maxSize,
    multiple,
    disabled,
  });

  return (
    <div
      {...getRootProps()}
      className={cn(
        'relative border-2 border-dashed rounded-lg p-6 transition-colors cursor-pointer',
        'hover:border-primary hover:bg-primary/5',
        isDragActive && !isDragReject && 'border-primary bg-primary/10',
        isDragReject && 'border-red-500 bg-red-50',
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
    >
      <input {...getInputProps()} />
      {children || (
        <div className="flex flex-col items-center justify-center text-center">
          <svg
            className={cn(
              'w-10 h-10 mb-3',
              isDragActive ? 'text-primary' : 'text-gray-400'
            )}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
            />
          </svg>
          {isDragActive ? (
            <p className="text-primary font-medium">Drop files here...</p>
          ) : (
            <>
              <p className="text-gray-600">
                <span className="font-medium text-primary">Click to upload</span> or drag
                and drop
              </p>
              <p className="text-sm text-gray-500 mt-1">
                {accept
                  ? `Accepted: ${Object.values(accept).flat().join(', ')}`
                  : 'Any file type'}
              </p>
              <p className="text-sm text-gray-500">
                Max size: {formatBytes(maxSize)}
                {multiple && maxFiles > 1 && ` · Max files: ${maxFiles}`}
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export interface FilePreviewProps {
  file: File;
  onRemove: () => void;
  showSize?: boolean;
}

export function FilePreview({ file, onRemove, showSize = true }: FilePreviewProps) {
  const isImage = file.type.startsWith('image/');
  const preview = isImage ? URL.createObjectURL(file) : null;

  return (
    <div className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg">
      {isImage && preview ? (
        <img
          src={preview}
          alt={file.name}
          className="w-12 h-12 object-cover rounded"
          onLoad={() => URL.revokeObjectURL(preview)}
        />
      ) : (
        <div className="w-12 h-12 flex items-center justify-center bg-white border border-gray-200 rounded">
          <svg
            className="w-6 h-6 text-gray-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{file.name}</p>
        {showSize && (
          <p className="text-xs text-gray-500">{formatBytes(file.size)}</p>
        )}
      </div>
      <button
        type="button"
        onClick={onRemove}
        className="p-1 hover:bg-primary/10 rounded transition-colors"
        aria-label="Remove file"
      >
        <svg
          className="w-5 h-5 text-gray-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>
    </div>
  );
}
