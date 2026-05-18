import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'node:crypto';
import { buildLessonDocx } from '@/lib/export/lessonDocx';
import type { SingleLessonResponse } from '@/lib/schemas';

export const runtime = 'nodejs';
export const maxDuration = 30;
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const requestId = randomUUID();
  const startedAt = Date.now();

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: 'El cuerpo de la solicitud debe ser JSON válido.', code: 'invalid-json', requestId },
      { status: 400 }
    );
  }

  const lesson = (body as { lesson?: SingleLessonResponse } | undefined)?.lesson;
  if (
    !lesson ||
    typeof lesson !== 'object' ||
    typeof lesson.title !== 'string' ||
    !lesson.meta ||
    !lesson.overview ||
    !lesson.core_content ||
    !Array.isArray(lesson.phases)
  ) {
    return NextResponse.json(
      {
        error: 'Falta la clase generada o tiene un formato inválido.',
        code: 'missing-lesson',
        requestId,
      },
      { status: 400 }
    );
  }

  try {
    const buffer = await buildLessonDocx(lesson);
    const slug =
      lesson.title.replace(/[^a-zA-Z0-9-]+/g, '_').toLowerCase().slice(0, 80) || 'aula-clase';

    console.info(
      `[DOCX] ${requestId} generated ${buffer.byteLength} bytes in ${Date.now() - startedAt}ms`
    );

    return new NextResponse(buffer as unknown as BodyInit, {
      headers: {
        'Content-Type':
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="${slug}.docx"`,
        'X-Request-Id': requestId,
      },
    });
  } catch (error) {
    console.error(`[DOCX] ${requestId} error`, error);
    const payload: Record<string, unknown> = {
      error: 'No pudimos generar el documento.',
      code: 'export-failed',
      requestId,
    };
    if (process.env.NODE_ENV !== 'production' && error instanceof Error) {
      payload.details = error.message;
    }
    return NextResponse.json(payload, { status: 500 });
  }
}
