import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'node:crypto';
import { buildWeeklyLessonProgram } from '@/lib/orchestrator';
import { LLMServiceError, parseLessonPlanInput } from '@/lib/llm';
import type { LessonPlanInput } from '@/lib/schemas';

export async function POST(request: NextRequest) {
  const requestId = randomUUID();
  const startedAt = Date.now();

  try {
    const body = await request.json();
    console.info(`[WeeklyLessonPlan] ${requestId} received payload`);
    console.debug(`[WeeklyLessonPlan] ${requestId} body`, body);

    let validatedInput: LessonPlanInput;
    try {
      validatedInput = parseLessonPlanInput(body);
      console.info(`[WeeklyLessonPlan] ${requestId} validation succeeded`);
    } catch (validationError) {
      console.error(`[WeeklyLessonPlan] ${requestId} validation failed`, validationError);

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
      console.info(`[WeeklyLessonPlan] ${requestId} streaming generation started`);
      const encoder = new TextEncoder();

      const stream = new ReadableStream({
        start: async (controller) => {
          const send = (event: string, data: Record<string, unknown>) => {
            controller.enqueue(
              encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
            );
          };

          try {
            const program = await buildWeeklyLessonProgram(validatedInput, {
              onStage: (stage, payload) => {
                send('status', {
                  stage,
                  ...(payload ?? {}),
                  requestId,
                });
              },
            });

            send('complete', { program, requestId });
            console.info(
              `[WeeklyLessonPlan] ${requestId} streaming generation completed in ${Date.now() - startedAt}ms`
            );
          } catch (err) {
            // Logging mejorado con detalles completos
            if (err instanceof LLMServiceError) {
              console.error(`[WeeklyLessonPlan] ${requestId} streaming generation failed`, {
                code: err.code,
                message: err.message,
                meta: err.meta,
                stack: err.stack,
              });
            } else {
              console.error(`[WeeklyLessonPlan] ${requestId} streaming generation failed`, err);
            }

            if (err instanceof LLMServiceError) {
              // Usar mensaje específico del error, con fallback a mensaje genérico
              const errorMessage = err.message || 'The AI service could not complete the lesson plan. Please try again in a few minutes.';
              
              send('error', {
                error: errorMessage,
                code: err.code,
                details: process.env.NODE_ENV !== 'production' ? (err.meta ? JSON.stringify(err.meta) : undefined) : undefined,
                requestId,
              });
            } else if (err instanceof Error) {
              send('error', {
                error: err.message || 'The lesson plan could not be generated.',
                requestId,
              });
            } else {
              send('error', {
                error: 'The lesson plan could not be generated.',
                requestId,
              });
            }
          } finally {
            controller.close();
          }
        },
        cancel() {
          console.warn(`[WeeklyLessonPlan] ${requestId} stream cancelled by client`);
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

    console.info(`[WeeklyLessonPlan] ${requestId} generation started`);
    const program = await buildWeeklyLessonProgram(validatedInput);
    console.info(
      `[WeeklyLessonPlan] ${requestId} generation completed in ${Date.now() - startedAt}ms`
    );

    return NextResponse.json(program, { status: 200 });
  } catch (error) {
    // Logging mejorado con detalles completos
    if (error instanceof LLMServiceError) {
      console.error(`[WeeklyLessonPlan] ${requestId} generation failed`, {
        code: error.code,
        message: error.message,
        meta: error.meta,
        stack: error.stack,
      });
    } else {
      console.error(`[WeeklyLessonPlan] ${requestId} generation failed`, error);
    }

    if (error instanceof LLMServiceError) {
      // Usar mensaje específico del error, con fallback a mensaje genérico
      const errorMessage = error.message || 'The AI service could not complete the lesson plan. Please try again in a few minutes.';
      
      const responseBody: Record<string, unknown> = {
        error: errorMessage,
        code: error.code,
        requestId,
      };

      // Incluir detalles adicionales en desarrollo o para errores de configuración
      if (process.env.NODE_ENV !== 'production' || error.code === 'api-error') {
        if (error.meta) {
          responseBody.meta = error.meta;
        }
        // Incluir detalles técnicos solo en desarrollo
        if (process.env.NODE_ENV !== 'production') {
          responseBody.details = error.message;
        }
      }

      return NextResponse.json(responseBody, { status: 502 });
    }

    if (error instanceof Error) {
      return NextResponse.json(
        {
          error: error.message || 'The lesson plan could not be generated.',
          details: process.env.NODE_ENV !== 'production' ? error.stack : undefined,
          requestId,
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        error: 'The lesson plan could not be generated.',
        requestId,
      },
      { status: 500 }
    );
  }
}


