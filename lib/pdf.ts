const MAX_BYTES = 10 * 1024 * 1024;
const MAX_PAGES = 50;
const MAX_WORDS = 20_000;
const MIN_TEXT_CHARS = 50;

export const PDF_LIMITS = {
  maxBytes: MAX_BYTES,
  maxPages: MAX_PAGES,
  maxWords: MAX_WORDS,
  minTextChars: MIN_TEXT_CHARS,
};

export interface ExtractedSource {
  filename: string;
  text: string;
  pageCount: number;
  wordCount: number;
  truncated: boolean;
}

export type SourceExtractionCode =
  | 'too-large'
  | 'too-many-pages'
  | 'no-text'
  | 'bad-type'
  | 'parse-failed';

export class SourceExtractionError extends Error {
  readonly code: SourceExtractionCode;
  constructor(message: string, code: SourceExtractionCode) {
    super(message);
    this.name = 'SourceExtractionError';
    this.code = code;
  }
}

function isPdf(filename: string, mimeType: string) {
  return mimeType === 'application/pdf' || filename.toLowerCase().endsWith('.pdf');
}

function isTextLike(filename: string, mimeType: string) {
  return mimeType.startsWith('text/') || /\.(txt|md|markdown)$/i.test(filename);
}

export async function extractFromBuffer(
  buffer: Buffer,
  filename: string,
  mimeType: string
): Promise<ExtractedSource> {
  if (buffer.length > MAX_BYTES) {
    throw new SourceExtractionError(
      `El archivo supera el límite de ${MAX_BYTES / (1024 * 1024)} MB.`,
      'too-large'
    );
  }

  let text = '';
  let pageCount = 1;

  if (isPdf(filename, mimeType)) {
    try {
      const pdfParse = (await import('pdf-parse')).default;
      const result = await pdfParse(buffer);
      text = (result.text ?? '').trim();
      pageCount = result.numpages ?? 1;
    } catch (err) {
      if (err instanceof SourceExtractionError) throw err;
      console.error('[lib/pdf] PDF parse failed:', err);
      throw new SourceExtractionError(
        'No pudimos leer este PDF. Verifica que no esté dañado o protegido.',
        'parse-failed'
      );
    }
  } else if (isTextLike(filename, mimeType)) {
    text = buffer.toString('utf-8').trim();
    pageCount = 1;
  } else {
    throw new SourceExtractionError(
      'Formato no soportado. Usá PDF, TXT o Markdown.',
      'bad-type'
    );
  }

  if (pageCount > MAX_PAGES) {
    throw new SourceExtractionError(
      `Demasiadas páginas (${pageCount}). El máximo es ${MAX_PAGES}.`,
      'too-many-pages'
    );
  }
  if (text.length < MIN_TEXT_CHARS) {
    throw new SourceExtractionError(
      'No pudimos extraer texto del archivo. Si es un PDF escaneado, conviértelo a texto primero o prueba con otro archivo.',
      'no-text'
    );
  }

  const words = text.split(/\s+/).filter(Boolean);
  let wordCount = words.length;
  let truncated = false;
  if (wordCount > MAX_WORDS) {
    text = words.slice(0, MAX_WORDS).join(' ');
    wordCount = MAX_WORDS;
    truncated = true;
  }

  return { filename, text, pageCount, wordCount, truncated };
}
