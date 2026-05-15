import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'node:crypto';
import { extractFromBuffer, SourceExtractionError } from '@/lib/pdf';

export const maxDuration = 30;

export async function POST(request: NextRequest) {
  const requestId = randomUUID();
  const startedAt = Date.now();

  try {
    const formData = await request.formData();
    const file = formData.get('file');

    if (!file || typeof file === 'string') {
      return NextResponse.json(
        { error: 'No se recibió ningún archivo.', code: 'no-file', requestId },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await (file as File).arrayBuffer());
    const filename = (file as File).name || 'document';
    const mimeType = (file as File).type || '';

    console.info(`[ExtractSource] ${requestId} received ${filename} (${buffer.length} bytes, ${mimeType})`);

    const extracted = await extractFromBuffer(buffer, filename, mimeType);

    console.info(
      `[ExtractSource] ${requestId} extracted in ${Date.now() - startedAt}ms — ${extracted.pageCount} pages, ${extracted.wordCount} words${extracted.truncated ? ' (truncated)' : ''}`
    );

    return NextResponse.json(extracted, { status: 200 });
  } catch (err) {
    if (err instanceof SourceExtractionError) {
      console.warn(`[ExtractSource] ${requestId} extraction error: ${err.code} — ${err.message}`);
      return NextResponse.json(
        { error: err.message, code: err.code, requestId },
        { status: 422 }
      );
    }

    console.error(`[ExtractSource] ${requestId} unexpected error`, err);
    const message = err instanceof Error ? err.message : 'No pudimos procesar el archivo.';
    return NextResponse.json(
      { error: message, code: 'internal', requestId },
      { status: 500 }
    );
  }
}
