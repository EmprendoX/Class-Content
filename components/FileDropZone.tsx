'use client';

import { useRef, useState, DragEvent, ChangeEvent } from 'react';
import Icon from './Icon';

export interface AttachedSource {
  filename: string;
  text: string;
  pageCount: number;
  wordCount: number;
  truncated: boolean;
}

interface FileDropZoneProps {
  attached: AttachedSource | null;
  onAttached: (source: AttachedSource) => void;
  onClear: () => void;
  disabled?: boolean;
  language?: 'es' | 'en';
}

const ACCEPTED_TYPES = ['application/pdf', 'text/plain', 'text/markdown'];
const ACCEPTED_EXTENSIONS = ['.pdf', '.txt', '.md', '.markdown'];
const MAX_BYTES = 10 * 1024 * 1024;

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function isAcceptableFile(file: File) {
  if (ACCEPTED_TYPES.includes(file.type)) return true;
  const lower = file.name.toLowerCase();
  return ACCEPTED_EXTENSIONS.some((ext) => lower.endsWith(ext));
}

export default function FileDropZone({
  attached,
  onAttached,
  onClear,
  disabled = false,
  language = 'es',
}: FileDropZoneProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadingName, setUploadingName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const t = (es: string, en: string) => (language === 'es' ? es : en);

  const handleFile = async (file: File) => {
    setError(null);

    if (!isAcceptableFile(file)) {
      setError(t('Formato no soportado. Solo PDF, TXT o Markdown.', 'Unsupported format. Only PDF, TXT or Markdown.'));
      return;
    }
    if (file.size > MAX_BYTES) {
      setError(
        t(
          `El archivo pesa ${formatBytes(file.size)}. El máximo es 10 MB.`,
          `File is ${formatBytes(file.size)}. Max is 10 MB.`
        )
      );
      return;
    }

    setUploading(true);
    setUploadingName(file.name);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/extract-source', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || t('No pudimos procesar el archivo.', 'Could not process the file.'));
      }

      const data: AttachedSource = await response.json();
      onAttached(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('Error al subir.', 'Upload error.'));
    } finally {
      setUploading(false);
      setUploadingName(null);
    }
  };

  const onDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (disabled || uploading) return;
    setDragOver(true);
  };

  const onDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
  };

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    if (disabled || uploading) return;
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const onSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    if (inputRef.current) inputRef.current.value = '';
  };

  const triggerSelect = () => {
    if (disabled || uploading) return;
    inputRef.current?.click();
  };

  // ATTACHED — show pill
  if (attached) {
    return (
      <div className="rounded-xl border border-brand-200 bg-brand-50/60 p-3 animate-fade-in">
        <div className="flex items-start gap-3">
          <div className="flex-none w-10 h-10 rounded-xl bg-white border border-brand-200 flex items-center justify-center text-brand-600">
            <Icon name="sheet" size={20} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-ink-900 truncate">{attached.filename}</p>
            <p className="text-xs text-ink-600 mt-0.5">
              {attached.pageCount} {t(attached.pageCount === 1 ? 'página' : 'páginas', attached.pageCount === 1 ? 'page' : 'pages')}
              {' · '}
              {attached.wordCount.toLocaleString(language === 'es' ? 'es' : 'en')}{' '}
              {t('palabras', 'words')}
            </p>
            {attached.truncated && (
              <p className="mt-1.5 inline-flex items-start gap-1.5 text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-2 py-1">
                <Icon name="warning" size={12} className="flex-none mt-0.5" />
                <span>
                  {t(
                    'El archivo se recortó a 20,000 palabras. La clase solo usará esa porción.',
                    'File truncated to 20,000 words. The lesson will only see that portion.'
                  )}
                </span>
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClear}
            disabled={disabled}
            className="flex-none w-8 h-8 rounded-lg text-ink-500 hover:bg-white hover:text-rose-600 transition-colors disabled:opacity-40"
            aria-label={t('Quitar archivo', 'Remove file')}
          >
            <span className="text-lg leading-none">×</span>
          </button>
        </div>
      </div>
    );
  }

  // IDLE / DRAG / UPLOADING / ERROR
  return (
    <div>
      <div
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={triggerSelect}
        role="button"
        tabIndex={disabled || uploading ? -1 : 0}
        onKeyDown={(e) => {
          if ((e.key === 'Enter' || e.key === ' ') && !disabled && !uploading) {
            e.preventDefault();
            triggerSelect();
          }
        }}
        className={`relative rounded-xl border-2 border-dashed transition-all duration-200 px-4 py-5 cursor-pointer ${
          disabled || uploading
            ? 'opacity-60 cursor-not-allowed border-ink-200 bg-ink-50/50'
            : dragOver
            ? 'border-brand-400 bg-brand-50 scale-[1.01]'
            : 'border-ink-200 hover:border-brand-300 hover:bg-brand-50/30'
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED_EXTENSIONS.join(',')}
          onChange={onSelect}
          disabled={disabled || uploading}
          className="hidden"
        />
        <div className="flex items-center gap-3">
          <div
            className={`flex-none w-11 h-11 rounded-xl flex items-center justify-center transition-colors ${
              dragOver ? 'bg-brand-100 text-brand-700' : 'bg-ink-100 text-ink-500'
            }`}
          >
            {uploading ? (
              <span className="w-5 h-5 border-2 border-brand-200 border-t-brand-600 rounded-full animate-spin" />
            ) : (
              <Icon name="sheet" size={20} />
            )}
          </div>
          <div className="flex-1 min-w-0">
            {uploading ? (
              <>
                <p className="text-sm font-semibold text-brand-700">
                  {t('Leyendo', 'Reading')}{' '}
                  <span className="truncate inline-block max-w-[180px] align-bottom">{uploadingName}</span>…
                </p>
                <p className="text-xs text-ink-500 mt-0.5">
                  {t('Esto tarda unos segundos.', 'This takes a few seconds.')}
                </p>
              </>
            ) : (
              <>
                <p className="text-sm font-semibold text-ink-900">
                  {t('Arrastra un PDF, TXT o Markdown', 'Drop a PDF, TXT or Markdown')}
                  <span className="font-normal text-ink-500"> · {t('o haz clic', 'or click')}</span>
                </p>
                <p className="text-xs text-ink-500 mt-0.5">
                  {t(
                    'Se usará como fuente de hechos, ejemplos y vocabulario. Máx. 10 MB / 50 páginas.',
                    'I will use it as a source of facts, examples and vocabulary. Max 10 MB / 50 pages.'
                  )}
                </p>
              </>
            )}
          </div>
        </div>
      </div>
      {error && (
        <div className="mt-2 flex items-start gap-2 p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-xs animate-fade-in">
          <Icon name="warning" size={14} className="flex-none mt-0.5" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
