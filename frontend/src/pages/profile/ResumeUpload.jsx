import React, { useEffect, useMemo, useRef, useState } from 'react';
import api from "../../api/api";
import { deleteResume } from '../../services/resumeService';

const MAX_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED_MIME = ['application/pdf'];

const formatBytes = (bytes) => {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const val = bytes / 1024 ** i;
  const precision = i === 0 ? 0 : 2;
  return `${val.toFixed(precision)} ${units[i]}`;
};

const ResumeUpload = () => {
  const fileInputRef = useRef(null);

  const [selectedFile, setSelectedFile] = useState(null);
  const [validationError, setValidationError] = useState('');

const [uploading, setUploading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [hasResume, setHasResume] = useState(false);

  const canUpload = useMemo(() => {
    return Boolean(selectedFile) && !validationError && !uploading && !deleting;
  }, [selectedFile, validationError, uploading, deleting]);

  // Detect whether the student already has a stored resume so the Delete action
  // is available even before a new file is selected.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await api.get('/api/students/profile');
        const resumeUrl = res?.data?.resumeUrl;
        if (!cancelled) setHasResume(Boolean(resumeUrl && String(resumeUrl).trim()));
      } catch {
        if (!cancelled) setHasResume(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const validateFile = (file) => {
    if (!file) return '';

    if (file.type && !ALLOWED_MIME.includes(file.type)) {
      return 'Only PDF files are allowed.';
    }

    // Fallback for cases where type may be missing/incorrect.
    if (file.name && !file.name.toLowerCase().endsWith('.pdf')) {
      return 'Only PDF files are allowed.';
    }

    if (file.size > MAX_BYTES) {
      return 'File size must be 5 MB or less.';
    }

    return '';
  };

  const setFileFromInput = (file) => {
    setValidationError('');
    setSuccessMessage('');

    const err = validateFile(file);
    setValidationError(err);

    setSelectedFile(err ? null : file);
  };

  const onBrowse = () => {
    fileInputRef.current?.click?.();
  };

  const onFileChange = (e) => {
    const file = e?.target?.files?.[0] ?? null;
    setFileFromInput(file);

    // Allow re-uploading the same file.
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const onDrop = (e) => {
    e.preventDefault();
    const file = e?.dataTransfer?.files?.[0] ?? null;
    setFileFromInput(file);
  };

  const onDragOver = (e) => {
    e.preventDefault();
  };

  const onRemove = () => {
    setSelectedFile(null);
    setValidationError('');
    setSuccessMessage('');

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const onUpload = async () => {
    if (!canUpload || !selectedFile) return;

    setUploading(true);
    setValidationError('');
    setSuccessMessage('');

    try {
      const formData = new FormData();
      formData.append('resume', selectedFile);

      const res = await api.post('/api/students/profile/resume', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

const msg = res?.data?.message || 'Resume uploaded successfully.';
      setSuccessMessage(msg);
      setHasResume(true);
    } catch (e) {
      setValidationError(e?.message || 'Failed to upload resume');
    } finally {
      setUploading(false);
    }
  };

  const onDelete = async () => {
    if (deleting) return;

    const confirmed = window.confirm(
      'Are you sure you want to delete your resume? This cannot be undone.'
    );
    if (!confirmed) return;

    setDeleting(true);
    setValidationError('');
    setSuccessMessage('');

    try {
      await deleteResume();
      setSuccessMessage('Resume deleted successfully.');
      setHasResume(false);
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (e) {
      const msg =
        e?.response?.data?.message ||
        e?.response?.data?.error ||
        e?.message ||
        'Failed to delete resume';
      setValidationError(msg);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-sm p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-50">Resume Upload</h2>
          <p className="mt-1 text-sm text-slate-300">Upload a PDF resume (max 5 MB).</p>
        </div>
      </div>

      <div
        className="mt-4"
        onDrop={onDrop}
        onDragOver={onDragOver}
        role="group"
        aria-label="Resume file upload"
      >
        <div className="w-full">
          <button
            type="button"
            onClick={onBrowse}
            className="w-full rounded-lg border border-slate-800 bg-slate-950 px-4 py-5 text-left hover:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-400"
            aria-label="Browse PDF resume"
          >
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                <div className="text-sm font-medium text-slate-50">Drag & drop your PDF here</div>
                <div className="mt-1 text-xs text-slate-400">Or browse to select a file</div>
              </div>
              <div className="shrink-0 text-indigo-200" aria-hidden="true">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 16V4" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7 9l5-5 5 5" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 20h14" />
                </svg>
              </div>
            </div>
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf,.pdf"
            onChange={onFileChange}
            className="sr-only"
            aria-hidden="true"
            tabIndex={-1}
          />

          <div className="mt-4 grid gap-3">
            {selectedFile ? (
              <div className="bg-slate-950 border border-slate-800 rounded-lg p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-slate-50 truncate">
                      Selected: {selectedFile?.name}
                    </div>
                    <div className="mt-1 text-xs text-slate-300">Size: {formatBytes(selectedFile?.size)}</div>
                  </div>

                  <button
                    type="button"
                    onClick={onRemove}
                    className="rounded-lg px-3 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                    aria-label="Remove resume"
                    disabled={uploading}
                    aria-disabled={uploading}
                  >
                    Remove Resume
                  </button>
                </div>
              </div>
            ) : null}

            {validationError ? (
              <div
                role="status"
                aria-live="polite"
                className="bg-red-950/40 border border-red-900 text-red-100 rounded-lg p-4"
              >
                {validationError}
              </div>
            ) : null}

            {uploading ? (
              <div
                role="status"
                aria-live="polite"
                className="bg-slate-950 border border-slate-800 text-slate-200 rounded-lg p-4"
                aria-busy="true"
              >
                Uploading resume...
              </div>
            ) : null}

            {successMessage ? (
              <div
                role="status"
                aria-live="polite"
                className="bg-emerald-950/40 border border-emerald-900 text-emerald-100 rounded-lg p-4"
              >
                {successMessage}
              </div>
            ) : null}
          </div>

<div className="mt-4 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-end">
            <button
              type="button"
              onClick={onUpload}
              disabled={!canUpload}
              aria-disabled={!canUpload}
              aria-busy={uploading}
              className="rounded-lg px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-indigo-400"
            >
              {uploading ? 'Uploading...' : 'Upload Resume'}
            </button>

            {hasResume ? (
              <button
                type="button"
                onClick={onDelete}
                disabled={deleting || uploading}
                aria-disabled={deleting || uploading}
                aria-busy={deleting}
                className="rounded-lg px-4 py-2 bg-red-900/40 hover:bg-red-900/50 text-red-100 font-medium disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-red-300"
              >
                {deleting ? 'Deleting...' : 'Delete Resume'}
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
};

export default React.memo(ResumeUpload);

