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
            console.error(`[WeeklyLessonPlan] ${requestId} streaming generation failed`, err);

            if (err instanceof LLMServiceError) {
              send('error', {
                error:
                  'The AI service could not complete the lesson plan. Please try again in a few minutes.',
                code: err.code,
                details: process.env.NODE_ENV !== 'production' ? err.message : undefined,
                requestId,
              });
            } else if (err instanceof Error) {
              send('error', {
                error: err.message,
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
    console.error(`[WeeklyLessonPlan] ${requestId} generation failed`, error);

    if (error instanceof LLMServiceError) {
      const responseBody: Record<string, unknown> = {
        error: 'The AI service could not complete the lesson plan. Please try again in a few minutes.',
        code: error.code,
        requestId,
      };

      if (process.env.NODE_ENV !== 'production') {
        responseBody.details = error.message;
        if (error.meta) {
          responseBody.meta = error.meta;
        }
      }

      return NextResponse.json(responseBody, { status: 502 });
    }

    if (error instanceof Error) {
      return NextResponse.json(
        {
          error: 'The lesson plan could not be generated.',
          details: process.env.NODE_ENV !== 'production' ? error.message : undefined,
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


