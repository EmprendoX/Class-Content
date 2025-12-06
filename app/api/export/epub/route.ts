import { NextRequest, NextResponse } from 'next/server';
import { readFileSync, unlinkSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { randomUUID } from 'node:crypto';
import type { EbookOptions } from 'epub-gen';

const MAX_MARKDOWN_LENGTH = 500 * 1024; // 500 KB aprox.

export async function POST(request: NextRequest) {
  const requestId = randomUUID();
  const startedAt = Date.now();
  let tempFilePath: string | null = null;

  try {
    let parsedBody: unknown;
    try {
      parsedBody = await request.json();
    } catch {
      return NextResponse.json(
        { error: 'El cuerpo de la solicitud debe ser JSON válido.', code: 'invalid-json', requestId },
        { status: 400 }
      );
    }

    const { markdown, title, meta } = (parsedBody ?? {}) as {
      markdown?: string;
      title?: string;
      meta?: { title?: string };
    };

    if (!markdown || typeof markdown !== 'string') {
      return NextResponse.json(
        { error: 'Debes enviar el contenido Markdown a exportar.', code: 'missing-markdown', requestId },
        { status: 400 }
      );
    }

    if (markdown.length > MAX_MARKDOWN_LENGTH) {
      return NextResponse.json(
        {
          error: 'El documento es demasiado grande para exportar a EPUB (máximo 500 KB).',
          code: 'payload-too-large',
          requestId,
        },
        { status: 413 }
      );
    }

    tempFilePath = join(tmpdir(), `teaching-guide-${requestId}.epub`);

    const sections = markdown
      .split(/(?=^#+\s+)/m)
      .map((section) => section.trim())
      .filter(Boolean);

    const safeSections = sections.length > 0 ? sections : [markdown.trim()];

    const publicationTitle = title || meta?.title || 'Teaching Guide';

    const epubOptions: EbookOptions = {
      title: publicationTitle,
      author: 'Teaching Assistant',
      publisher: 'Teaching Assistant',
      output: tempFilePath,
      content: safeSections.map((section: string, index: number) => {
        const lines = section.split('\n');
        const firstLine = lines[0] || '';
        const titleMatch = firstLine.match(/^#+\s+(.+)$/);
        const chapterTitle = titleMatch ? titleMatch[1].trim() : `Chapter ${index + 1}`;

        return {
          title: chapterTitle,
          data: section,
        };
      }),
    };

    const { default: EPUB } = await import('epub-gen');
    await new Promise<void>((resolve, reject) => {
      new EPUB(epubOptions).promise.then(() => resolve()).catch(reject);
    });

    const epubBuffer = readFileSync(tempFilePath);

    const downloadName = (publicationTitle || 'teaching_guide')
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '_');

    return new NextResponse(epubBuffer, {
      headers: {
        'Content-Type': 'application/epub+zip',
        'Content-Disposition': `attachment; filename="${downloadName || 'teaching_guide'}.epub"`,
        'X-Request-Id': requestId,
      },
    });
  } catch (error) {
    console.error(`[EPUB] ${requestId} error`, error);
    const payload: Record<string, unknown> = {
      error: 'Unable to generate the EPUB.',
      code: 'export-failed',
      requestId,
    };
    if (process.env.NODE_ENV !== 'production' && error instanceof Error) {
      payload.details = error.message;
    }
    return NextResponse.json(payload, { status: 500 });
  } finally {
    if (tempFilePath) {
      try {
        unlinkSync(tempFilePath);
      } catch (cleanupError) {
        console.warn(`[EPUB] ${requestId} cleanup failed`, cleanupError);
      }
    }
    console.info(`[EPUB] ${requestId} completed in ${Date.now() - startedAt}ms`);
  }
}

