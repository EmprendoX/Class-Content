import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'node:crypto';
import { buildClassPackage } from '@/lib/orchestrator';
import { LLMServiceError, parseClassPlanInput } from '@/lib/llm';
import type { ClassPlanRequest } from '@/lib/schemas';

export async function POST(request: NextRequest) {
  const requestId = randomUUID();
  const startedAt = Date.now();

  try {
    const body = await request.json();
    console.info(`[ClassPackage] ${requestId} received payload`);
    console.debug(`[ClassPackage] ${requestId} body`, body);

    let validatedInput: ClassPlanRequest;
    try {
      validatedInput = parseClassPlanInput(body);
      console.info(`[ClassPackage] ${requestId} validation succeeded`);
    } catch (validationError) {
      console.error(`[ClassPackage] ${requestId} validation failed`, validationError);

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
          {
            error: errorMessage,
            code: 'validation-error',
            requestId,
          },
          { status: 400 }
        );
      }

      if (validationError instanceof Error) {
        return NextResponse.json(
          {
            error: validationError.message,
            code: 'validation-error',
            requestId,
          },
          { status: 400 }
        );
      }

      return NextResponse.json(
        {
          error: 'Validation failed. Please check your input.',
          code: 'validation-error',
          requestId,
        },
        { status: 400 }
      );
    }

    const wantsStream = request.headers.get('accept')?.includes('text/event-stream');

    if (wantsStream) {
      console.info(`[ClassPackage] ${requestId} streaming generation started`);
      const encoder = new TextEncoder();

      const stream = new ReadableStream({
        start: async (controller) => {
          const send = (event: string, data: Record<string, unknown>) => {
            controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
          };

          try {
            const pkg = await buildClassPackage(validatedInput, {
              onStage: (stage, payload) => {
                send('status', {
                  stage,
                  ...(payload ?? {}),
                  requestId,
                });
              },
            });

            send('complete', { pkg, requestId });
            console.info(
              `[ClassPackage] ${requestId} streaming generation completed in ${Date.now() - startedAt}ms`
            );
          } catch (err) {
            if (err instanceof LLMServiceError) {
              console.error(`[ClassPackage] ${requestId} streaming generation failed`, {
                code: err.code,
                message: err.message,
                meta: err.meta,
                stack: err.stack,
              });
            } else {
              console.error(`[ClassPackage] ${requestId} streaming generation failed`, err);
            }

            if (err instanceof LLMServiceError) {
              const errorMessage = err.message || 'The AI service could not complete the class package. Please try again soon.';

              send('error', {
                error: errorMessage,
                code: err.code,
                details: process.env.NODE_ENV !== 'production' ? (err.meta ? JSON.stringify(err.meta) : undefined) : undefined,
                requestId,
              });
            } else if (err instanceof Error) {
              send('error', {
                error: err.message || 'The class package could not be generated.',
                requestId,
              });
            } else {
              send('error', {
                error: 'The class package could not be generated.',
                requestId,
              });
            }
          } finally {
            controller.close();
          }
        },
        cancel() {
          console.warn(`[ClassPackage] ${requestId} stream cancelled by client`);
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

    console.info(`[ClassPackage] ${requestId} generation started`);
    const pkg = await buildClassPackage(validatedInput);
    console.info(`[ClassPackage] ${requestId} generation completed in ${Date.now() - startedAt}ms`);

    return NextResponse.json(pkg, { status: 200 });
  } catch (error) {
    if (error instanceof LLMServiceError) {
      console.error(`[ClassPackage] ${requestId} generation failed`, {
        code: error.code,
        message: error.message,
        meta: error.meta,
        stack: error.stack,
      });
    } else {
      console.error(`[ClassPackage] ${requestId} generation failed`, error);
    }

    if (error instanceof LLMServiceError) {
      const errorMessage = error.message || 'The AI service could not complete the class package. Please try again soon.';

      const responseBody: Record<string, unknown> = {
        error: errorMessage,
        code: error.code,
        requestId,
      };

      if (process.env.NODE_ENV !== 'production' || error.code === 'api-error') {
        if (error.meta) {
          responseBody.meta = error.meta;
        }
        if (process.env.NODE_ENV !== 'production') {
          responseBody.details = error.message;
        }
      }

      return NextResponse.json(responseBody, { status: 502 });
    }

    if (error instanceof Error) {
      return NextResponse.json(
        {
          error: error.message || 'The class package could not be generated.',
          details: process.env.NODE_ENV !== 'production' ? error.stack : undefined,
          requestId,
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        error: 'The class package could not be generated.',
        requestId,
      },
      { status: 500 }
    );
  }
}
