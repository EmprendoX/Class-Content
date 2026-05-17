import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'node:crypto';
import { buildSingleLesson } from '@/lib/orchestrator';
import { LLMServiceError, parseSingleLessonInput } from '@/lib/llm';
import { requireAccess } from '@/lib/access/guard';
import type { SingleLessonInput } from '@/lib/schemas';

export const maxDuration = 120;

export async function POST(request: NextRequest) {
  const requestId = randomUUID();
  const startedAt = Date.now();

  const gate = await requireAccess(request, requestId);
  if (!gate.ok) return gate.response;

  try {
    const body = await request.json();
    console.info(`[SingleLesson] ${requestId} received payload`);

    let validatedInput: SingleLessonInput;
    try {
      validatedInput = parseSingleLessonInput(body);
      console.info(`[SingleLesson] ${requestId} validation succeeded`);
    } catch (validationError) {
      console.error(`[SingleLesson] ${requestId} validation failed`, validationError);

      if (validationError && typeof validationError === 'object' && 'issues' in validationError) {
        const zodError = validationError as {
          issues: Array<{ message: string; path: (string | number)[]; code: string }>;
        };
        const errorMessages = zodError.issues.map((issue) => {
          const field = issue.path.join('.');
          const msg = `[${issue.code}] ${issue.message}`;
          return field ? `${field}: ${msg}` : msg;
        });
        const errorMessage = errorMessages.join('. ') || 'Validation failed';
        return NextResponse.json(
          { error: errorMessage, code: 'validation-error', requestId },
          { status: 400 }
        );
      }

      if (validationError instanceof Error) {
        return NextResponse.json(
          { error: validationError.message, code: 'validation-error', requestId },
          { status: 400 }
        );
      }

      return NextResponse.json(
        { error: 'Validation failed. Please check your input.', code: 'validation-error', requestId },
        { status: 400 }
      );
    }

    const wantsStream = request.headers.get('accept')?.includes('text/event-stream');

    if (wantsStream) {
      console.info(`[SingleLesson] ${requestId} streaming generation started`);
      const encoder = new TextEncoder();

      const stream = new ReadableStream({
        start: async (controller) => {
          const send = (event: string, data: Record<string, unknown>) => {
            controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
          };

          try {
            const lesson = await buildSingleLesson(validatedInput, {
              onStage: (stage, payload) => {
                send('status', { stage, ...(payload ?? {}), requestId });
              },
            });

            send('complete', { lesson, requestId });
            console.info(
              `[SingleLesson] ${requestId} streaming generation completed in ${Date.now() - startedAt}ms`
            );
          } catch (err) {
            if (err instanceof LLMServiceError) {
              console.error(`[SingleLesson] ${requestId} streaming generation failed`, {
                code: err.code,
                message: err.message,
                meta: err.meta,
              });
              send('error', {
                error: err.message,
                code: err.code,
                details:
                  process.env.NODE_ENV !== 'production'
                    ? err.meta
                      ? JSON.stringify(err.meta)
                      : undefined
                    : undefined,
                requestId,
              });
            } else if (err instanceof Error) {
              console.error(`[SingleLesson] ${requestId} streaming generation failed`, err);
              send('error', { error: err.message || 'The lesson could not be generated.', requestId });
            } else {
              send('error', { error: 'The lesson could not be generated.', requestId });
            }
          } finally {
            controller.close();
          }
        },
        cancel() {
          console.warn(`[SingleLesson] ${requestId} stream cancelled by client`);
        },
      });

      return new Response(stream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache, no-transform',
          Connection: 'keep-alive',
        },
      });
    }

    const lesson = await buildSingleLesson(validatedInput);
    return NextResponse.json(lesson, { status: 200 });
  } catch (error) {
    if (error instanceof LLMServiceError) {
      console.error(`[SingleLesson] ${requestId} generation failed`, {
        code: error.code,
        message: error.message,
        meta: error.meta,
      });

      const responseBody: Record<string, unknown> = {
        error: error.message || 'The AI service could not complete the lesson.',
        code: error.code,
        requestId,
      };

      if (process.env.NODE_ENV !== 'production' || error.code === 'api-error') {
        if (error.meta) responseBody.meta = error.meta;
        if (process.env.NODE_ENV !== 'production') responseBody.details = error.message;
      }

      return NextResponse.json(responseBody, { status: 502 });
    }

    if (error instanceof Error) {
      console.error(`[SingleLesson] ${requestId} generation failed`, error);
      return NextResponse.json(
        {
          error: error.message || 'The lesson could not be generated.',
          details: process.env.NODE_ENV !== 'production' ? error.stack : undefined,
          requestId,
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: 'The lesson could not be generated.', requestId },
      { status: 500 }
    );
  }
}
