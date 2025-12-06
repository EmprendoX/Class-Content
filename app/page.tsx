'use client';

import { useState } from 'react';
import ChatForm from '@/components/ChatForm';
import Progress from '@/components/Progress';
import Preview from '@/components/Preview';
import type { LessonProgramResponse } from '@/lib/schemas';

type ProgressStep = 'outline' | 'validate' | 'format' | null;

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [progressStep, setProgressStep] = useState<ProgressStep>(null);
  const [progressMessage, setProgressMessage] = useState<string | null>(null);
  const [program, setProgram] = useState<LessonProgramResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (data: {
    weeklyTheme: string;
    subjectArea: string;
    gradeLevel: string;
    learnerProfile?: string;
    constraints?: string;
  }) => {
    setLoading(true);
    setError(null);
    setProgram(null);
    setProgressStep(null);
    setProgressMessage(null);

    try {
      const response = await fetch('/api/generate-teaching-guide', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'text/event-stream',
        },
        body: JSON.stringify(data),
      });

      const contentType = response.headers.get('content-type') ?? '';

      if (!response.ok) {
        if (contentType.includes('application/json')) {
          const errorData = await response.json();
          throw new Error(
            errorData.error || errorData.details || 'The lesson plan could not be generated'
          );
        }

        const errorText = await response.text();
        throw new Error(errorText || 'The lesson plan could not be generated');
      }

      if (contentType.includes('application/json')) {
        const result = await response.json();
        setProgram(result);
        setProgressStep(null);
        setProgressMessage(null);
        return;
      }

      if (!contentType.includes('text/event-stream') || !response.body) {
        throw new Error('The server did not send live progress updates.');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let isComplete = false;
      let pendingError: Error | null = null;

      const flushBuffer = (chunk: string) => {
        const events = chunk.split('\n\n');
        for (const rawEvent of events) {
          if (!rawEvent.trim()) continue;

          let eventType = 'message';
          const dataLines: string[] = [];

          rawEvent.split('\n').forEach((line) => {
            if (line.startsWith('event:')) {
              eventType = line.slice(6).trim();
            } else if (line.startsWith('data:')) {
              dataLines.push(line.slice(5).trim());
            }
          });

          const dataString = dataLines.join('\n');
          if (!dataString) continue;

          try {
            const payload = JSON.parse(dataString);

            if (eventType === 'status') {
              const stage = payload.stage as ProgressStep | undefined;
              if (stage) {
                setProgressStep(stage);
              }

              if (stage === 'outline' && typeof payload.lessons === 'number') {
                setProgressMessage(`Lessons outlined: ${payload.lessons}/5`);
              } else if (stage === 'validate') {
                const issues = payload.issues as string[] | undefined;
                setProgressMessage(
                  issues && issues.length ? `Validation issues: ${issues.length}` : 'Validation complete'
                );
              } else {
                setProgressMessage(null);
              }
            } else if (eventType === 'error') {
              const message =
                payload.error || payload.message || 'The lesson plan could not be generated';
              pendingError = new Error(message);
            } else if (eventType === 'complete') {
              setProgram(payload.program as LessonProgramResponse);
              isComplete = true;
            }
          } catch (streamError) {
            pendingError =
              streamError instanceof Error
                ? streamError
                : new Error('Invalid progress payload from server.');
          }
        }
      };

      while (true) {
        const { done, value } = await reader.read();

        if (value) {
          buffer += decoder.decode(value, { stream: true });
          const lastSeparator = buffer.lastIndexOf('\n\n');
          if (lastSeparator !== -1) {
            const processable = buffer.slice(0, lastSeparator);
            buffer = buffer.slice(lastSeparator + 2);
            flushBuffer(processable);
          }
        }

        if (pendingError) {
          throw pendingError;
        }

        if (isComplete) {
          await reader.cancel();
          break;
        }

        if (done) {
          buffer += decoder.decode();
          if (buffer.trim()) {
            flushBuffer(buffer);
          }
          break;
        }
      }

      setProgressStep(null);
      setProgressMessage(null);

      if (!isComplete) {
        throw new Error('The stream finished without delivering the lesson plan.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'The lesson plan could not be generated');
      setProgressStep(null);
      setProgressMessage(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-amber-50">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <header className="mb-8 flex flex-col gap-2">
          <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-amber-700">
            <span className="h-2 w-2 rounded-full bg-amber-500" />
            Montessori-informed Lesson Plan Builder
          </div>
          <h1 className="text-4xl font-bold text-slate-900">Weekly Lesson Plan Builder</h1>
          <p className="text-slate-600 max-w-3xl">
            Generate a five-class weekly program with Montessori, constructivist, and critical-thinking checkpoints. All output is in English, with objectives, materials, hands-on activities, and reflective questions ready to print.
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column: Form */}
          <div className="bg-white rounded-2xl shadow-sm p-6 border border-amber-100">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-semibold text-slate-900">Plan inputs</h2>
              <span className="text-xs uppercase tracking-wide text-amber-600 bg-amber-50 px-3 py-1 rounded-full">
                English only
              </span>
            </div>
            <ChatForm onSubmit={handleSubmit} disabled={loading} />

            {error && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                {error}
              </div>
            )}
          </div>

          {/* Right Column: Progress and Preview */}
          <div className="bg-white rounded-2xl shadow-sm p-6 border border-amber-100">
            <h2 className="text-2xl font-semibold mb-4 text-slate-900">Generation status</h2>

            {loading && <Progress currentStep={progressStep} message={progressMessage} />}

            {program && (
              <div className="mt-6">
                <h3 className="text-xl font-semibold mb-4 text-slate-900">Weekly program ready</h3>
                <Preview program={program} />
              </div>
            )}

            {!loading && !program && (
              <div className="text-center text-slate-400 py-12">
                <p>Enter your theme and learning context to generate a five-lesson week.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

