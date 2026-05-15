'use client';

import { useState } from 'react';
import ChatForm, { LessonPlanForm } from '@/components/ChatForm';
import Progress from '@/components/Progress';
import Preview from '@/components/Preview';
import Logo from '@/components/Logo';
import Icon from '@/components/Icon';
import EmptyState from '@/components/EmptyState';
import type { SingleLessonResponse } from '@/lib/schemas';

type ProgressStep = 'outline' | 'validate' | 'format' | null;

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [progressStep, setProgressStep] = useState<ProgressStep>(null);
  const [progressMessage, setProgressMessage] = useState<string | null>(null);
  const [lesson, setLesson] = useState<SingleLessonResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submittedLanguage, setSubmittedLanguage] = useState<'es' | 'en'>('es');

  const handleSubmit = async (data: LessonPlanForm) => {
    setSubmittedLanguage(data.language);
    setLoading(true);
    setError(null);
    setLesson(null);
    setProgressStep(null);
    setProgressMessage(null);

    try {
      const response = await fetch('/api/generate-lesson', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'text/event-stream' },
        body: JSON.stringify(data),
      });

      const contentType = response.headers.get('content-type') ?? '';

      if (!response.ok) {
        if (contentType.includes('application/json')) {
          const errorData = await response.json();
          throw new Error(errorData.error || errorData.details || 'The lesson could not be generated');
        }
        const errorText = await response.text();
        throw new Error(errorText || 'The lesson could not be generated');
      }

      if (contentType.includes('application/json')) {
        const result = await response.json();
        setLesson(result);
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
            if (line.startsWith('event:')) eventType = line.slice(6).trim();
            else if (line.startsWith('data:')) dataLines.push(line.slice(5).trim());
          });
          const dataString = dataLines.join('\n');
          if (!dataString) continue;
          try {
            const payload = JSON.parse(dataString);
            if (eventType === 'status') {
              const stage = payload.stage as ProgressStep | undefined;
              if (stage) setProgressStep(stage);
              if (stage === 'outline' && typeof payload.phases === 'number') {
                setProgressMessage(
                  data.language === 'es' ? `Fases generadas: ${payload.phases}` : `Phases generated: ${payload.phases}`
                );
              } else if (stage === 'validate') {
                const issues = payload.issues as string[] | undefined;
                setProgressMessage(
                  issues && issues.length
                    ? data.language === 'es'
                      ? `Ajustando ${issues.length} detalle(s)…`
                      : `Adjusting ${issues.length} issue(s)…`
                    : data.language === 'es'
                    ? 'Validación completa'
                    : 'Validation complete'
                );
              } else {
                setProgressMessage(null);
              }
            } else if (eventType === 'error') {
              const message = payload.error || payload.message || 'The lesson could not be generated';
              pendingError = new Error(message);
            } else if (eventType === 'complete') {
              setLesson(payload.lesson as SingleLessonResponse);
              isComplete = true;
            }
          } catch (streamError) {
            pendingError =
              streamError instanceof Error ? streamError : new Error('Invalid progress payload from server.');
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
        if (pendingError) throw pendingError;
        if (isComplete) {
          await reader.cancel();
          break;
        }
        if (done) {
          buffer += decoder.decode();
          if (buffer.trim()) flushBuffer(buffer);
          break;
        }
      }

      setProgressStep(null);
      setProgressMessage(null);

      if (!isComplete) throw new Error('The stream finished without delivering the lesson.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'The lesson could not be generated');
      setProgressStep(null);
      setProgressMessage(null);
    } finally {
      setLoading(false);
    }
  };

  const t = (es: string, en: string) => (submittedLanguage === 'es' ? es : en);

  return (
    <div className="min-h-screen bg-hero">
      {/* Top navigation */}
      <nav className="sticky top-0 z-30 backdrop-blur-md bg-white/75 border-b border-ink-100 no-print">
        <div className="container mx-auto px-4 max-w-7xl flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <Logo size={32} />
            <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-accent-600 bg-accent-50 border border-accent-200 px-2 py-0.5 rounded-full">
              <Icon name="sparkle" size={10} />
              Beta
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs font-semibold text-ink-500">
            <Icon name="globe" size={14} />
            <span className="hidden sm:inline">ES · EN</span>
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-10 sm:py-14 max-w-7xl">
        {/* Hero */}
        <header className="mb-10 sm:mb-14 max-w-3xl">
          <div className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-brand-700 bg-white/80 border border-brand-100 rounded-full px-3 py-1.5 mb-5 shadow-soft">
            <Icon name="sparkle" size={12} />
            {t('Para docentes, educadores y padres de familia', 'For teachers, educators and families')}
          </div>
          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-extrabold text-ink-900 leading-[1.05] tracking-tight">
            {t('Del tema a la ', 'From topic to ')}
            <span className="text-gradient-brand">{t('clase completa', 'full lesson')}</span>
            {t(', en un minuto.', ', in a minute.')}
          </h1>
          <p className="mt-5 text-lg text-ink-600 leading-relaxed max-w-2xl">
            {t(
              'Dinos qué quieres enseñar y a quién. Recibe la clase completa, lista para impartir: guión del docente por fases, explicación del tema, ejemplos resueltos, hoja de trabajo con respuestas, ticket de salida y recado para los padres de familia.',
              'Tell us what you want to teach and to whom. You get the full lesson ready to deliver: phase-by-phase teacher script, full concept explanation, worked examples, worksheet with answer key, exit ticket, and parent note.'
            )}
          </p>
          <div className="mt-6 flex flex-wrap gap-3 text-sm">
            <span className="inline-flex items-center gap-1.5 text-ink-700 bg-white border border-ink-100 rounded-full px-3 py-1.5 shadow-soft">
              <Icon name="sheet" size={14} className="text-brand-600" />
              {t('Hoja de trabajo', 'Worksheet')}
            </span>
            <span className="inline-flex items-center gap-1.5 text-ink-700 bg-white border border-ink-100 rounded-full px-3 py-1.5 shadow-soft">
              <Icon name="ticket" size={14} className="text-accent-500" />
              {t('Ticket de salida', 'Exit ticket')}
            </span>
            <span className="inline-flex items-center gap-1.5 text-ink-700 bg-white border border-ink-100 rounded-full px-3 py-1.5 shadow-soft">
              <Icon name="globe" size={14} className="text-brand-600" />
              {t('Español / Inglés', 'Spanish / English')}
            </span>
            <span className="inline-flex items-center gap-1.5 text-ink-700 bg-white border border-ink-100 rounded-full px-3 py-1.5 shadow-soft">
              <Icon name="clock" size={14} className="text-accent-500" />
              {t('60-90 segundos', '60-90 seconds')}
            </span>
          </div>
        </header>

        {/* Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] gap-6 lg:gap-8 items-start">
          {/* Left: form panel */}
          <section className="lg:sticky lg:top-24 bg-white rounded-3xl shadow-soft border border-ink-100 overflow-hidden">
            <div className="bg-gradient-to-br from-brand-50 via-white to-accent-50/40 px-6 py-5 border-b border-ink-100">
              <h2 className="font-display text-xl font-bold text-ink-900">
                {t('Datos de la clase', 'Class inputs')}
              </h2>
              <p className="text-sm text-ink-500 mt-0.5">
                {t('Completa los campos requeridos y genera.', 'Fill the required fields and generate.')}
              </p>
            </div>
            <div className="p-6">
              <ChatForm onSubmit={handleSubmit} disabled={loading} />
              {error && (
                <div className="mt-4 flex items-start gap-2 p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-sm animate-fade-in">
                  <Icon name="warning" size={16} className="flex-none mt-0.5" />
                  <span>{error}</span>
                </div>
              )}
            </div>
          </section>

          {/* Right: status + preview */}
          <section className="bg-white rounded-3xl shadow-soft border border-ink-100 overflow-hidden">
            <div className="px-6 py-5 border-b border-ink-100 flex items-center justify-between">
              <h2 className="font-display text-xl font-bold text-ink-900">
                {lesson
                  ? t('Tu clase', 'Your lesson')
                  : loading
                  ? t('Generando…', 'Generating…')
                  : t('Vista previa', 'Preview')}
              </h2>
              {loading && (
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-700 bg-brand-50 border border-brand-100 rounded-full px-2.5 py-1">
                  <span className="w-1.5 h-1.5 bg-brand-500 rounded-full animate-pulse" />
                  {t('En vivo', 'Live')}
                </span>
              )}
            </div>
            <div className="p-6">
              {loading && <Progress currentStep={progressStep} message={progressMessage} />}

              {lesson && <Preview lesson={lesson} />}

              {!loading && !lesson && (
                <EmptyState
                  title={t('Esperando tu primer tema', 'Waiting for your first topic')}
                  description={t(
                    'Completa el formulario de la izquierda. En 60 a 90 segundos tendrás la clase completa con guión, ejemplos, hoja de trabajo y ticket de salida.',
                    'Fill the form on the left. In 60-90 seconds you will have the full lesson with script, examples, worksheet, and exit ticket.'
                  )}
                />
              )}
            </div>
          </section>
        </div>

        {/* Footer */}
        <footer className="mt-16 pt-8 border-t border-ink-100 text-center text-sm text-ink-500 no-print">
          <p className="flex items-center justify-center gap-1.5">
            <Logo variant="mark" size={16} />
            <span>
              <strong className="text-ink-700">Aula</strong> · {t('Hecho para docentes, educadores y padres de familia.', 'Built for teachers, educators and families.')}
            </span>
          </p>
        </footer>
      </main>
    </div>
  );
}
