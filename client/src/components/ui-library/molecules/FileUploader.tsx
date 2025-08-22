import React, { ChangeEvent, useRef, useState } from 'react';
// If using MUI, import Box, Button, Typography, LinearProgress, etc. Otherwise, use styled-components or CSS modules.
// import { Box, Button, Typography, LinearProgress } from '@mui/material';

export interface FileUploaderProps {
  accept?: string;
  maxSizeMB?: number;
  multiple?: boolean;
  onFilesSelected?: (files: File[]) => void;
  onUploadStart?: () => void;
  onUploadProgress?: (progress: number) => void;
  onUploadError?: (error: string) => void;
  onUploadSuccess?: (files: File[]) => void;
  disabled?: boolean;
  label?: string;
}

/**
 * Best-in-class FileUploader component with drag-and-drop, file preview, progress, and error handling.
 * - Accessible and keyboard-navigable
 * - Supports single/multiple file uploads
 * - Customizable via props
 */
const FileUploader: React.FC<FileUploaderProps> = ({
  accept = '*',
  maxSizeMB = 10,
  multiple = false,
  onFilesSelected,
  onUploadStart,
  onUploadProgress,
  onUploadError,
  onUploadSuccess,
  disabled = false,
  label = 'Upload files',
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<any>([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<any>(null);

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    const fileArr = Array.from(files);
    const oversized = fileArr.find(f => f.size > maxSizeMB * 1024 * 1024);
    if (oversized) {
      setError(`File ${oversized.name} exceeds the ${maxSizeMB}MB size limit.`);
      onUploadError?.(`File ${oversized.name} exceeds the ${maxSizeMB}MB size limit.`);
      return;
    }
    setSelectedFiles(fileArr);
    setError(null);
    onFilesSelected?.(fileArr);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    handleFiles(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const handleButtonClick = () => {
    inputRef.current?.click();
  };

  // Simulate upload for demo; replace with real upload logic as needed
  const handleUpload = async () => {
    if (!selectedFiles.length) return;
    setUploading(true);
    setProgress(0);
    setError(null);
    onUploadStart?.();
    try {
      for (let i = 1; i <= 100; i++) {
        await new Promise(res => setTimeout(res, 10));
        setProgress(i);
        onUploadProgress?.(i);
      }
      setUploading(false);
      onUploadSuccess?.(selectedFiles);
    } catch (_err) {
      setUploading(false);
      setError('Upload failed.');
      onUploadError?.('Upload failed.');
    }
  };

  return (
    <div
      tabIndex={0}
      role="button"
      aria-label={label}
      onClick={handleButtonClick}
      onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && handleButtonClick()}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      style={{
        border: dragActive ? '2px solid #1976d2' : '2px dashed #ccc',
        borderRadius: 8,
        padding: 24,
        textAlign: 'center',
        background: dragActive ? '#e3f2fd' : '#fafafa',
        cursor: disabled ? 'not-allowed' : 'pointer',
        outline: dragActive ? '2px solid #1976d2' : 'none',
        transition: 'background 0.2s, border 0.2s',
        position: 'relative',
      }}
      aria-disabled={disabled}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        style={{ display: 'none' }}
        onChange={handleInputChange}
        disabled={disabled}
        tabIndex={-1}
      />
      <div style={{ marginBottom: 12 }}>
        <strong>{label}</strong>
      </div>
      <div style={{ color: '#888', marginBottom: 12 }}>
        Drag & drop files here, or click to select
      </div>
      {selectedFiles.length > 0 && (
        <div style={{ marginBottom: 12 }}>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {selectedFiles.map((file: any) => (
              <li key={file.name} style={{ fontSize: 14 }}>
                {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
              </li>
            ))}
          </ul>
        </div>
      )}
      {error && (
        <div style={{ color: 'red', marginBottom: 12 }}>{error}</div>
      )}
      {uploading ? (
        <div style={{ marginBottom: 12 }}>
          <div style={{ width: '100%', background: '#eee', borderRadius: 4, height: 8, marginBottom: 4 }}>
            <div style={{ width: `${progress}%`, background: '#1976d2', height: 8, borderRadius: 4, transition: 'width 0.2s' }} />
          </div>
          <span style={{ fontSize: 12 }}>{progress}%</span>
        </div>
      ) : (
        <button
          type="button"
          onClick={handleUpload}
          disabled={disabled || !selectedFiles.length}
          style={{
            background: '#1976d2',
            color: '#fff',
            border: 'none',
            borderRadius: 4,
            padding: '8px 16px',
            cursor: disabled || !selectedFiles.length ? 'not-allowed' : 'pointer',
            fontWeight: 600,
            fontSize: 14,
          }}
        >
          Upload
        </button>
      )}
    </div>
  );
};

export default FileUploader; 