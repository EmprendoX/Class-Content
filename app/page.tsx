'use client';

import { useState } from 'react';
import ChatForm from '@/components/ChatForm';
import Progress from '@/components/Progress';
import Preview from '@/components/Preview';
import type { LinkedInCampaignOutput } from '@/lib/schemas';

type ProgressStep = 'ideation' | 'posts' | 'video' | 'format' | null;

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [progressStep, setProgressStep] = useState<ProgressStep>(null);
  const [progressMessage, setProgressMessage] = useState<string | null>(null);
  const [campaign, setCampaign] = useState<LinkedInCampaignOutput | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (data: {
    mainTheme: string;
    audienceProfile: string;
    campaignGoal: string;
    brandVoice?: string;
    callToAction?: string;
    offerDescription?: string;
    contextNotes?: string;
  }) => {
    setLoading(true);
    setError(null);
    setCampaign(null);
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
            errorData.error || errorData.details || 'No se pudo generar la campaña'
          );
        }

        const errorText = await response.text();
        throw new Error(errorText || 'No se pudo generar la campaña');
      }

      if (contentType.includes('application/json')) {
        const result = await response.json();
        setCampaign(result);
        setProgressStep(null);
        setProgressMessage(null);
        return;
      }

      if (!contentType.includes('text/event-stream') || !response.body) {
        throw new Error('El servidor no envió progreso en tiempo real.');
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

              if (stage === 'posts') {
                if (
                  typeof payload.completed === 'number' &&
                  typeof payload.total === 'number'
                ) {
                  setProgressMessage(`Posts listos: ${payload.completed}/${payload.total}`);
                }
              } else if (stage === 'video') {
                if (
                  typeof payload.completed === 'number' &&
                  typeof payload.total === 'number'
                ) {
                  setProgressMessage(`Guiones de video: ${payload.completed}/${payload.total}`);
                }
              } else {
                setProgressMessage(null);
              }
            } else if (eventType === 'error') {
              const message =
                payload.error || payload.message || 'No se pudo generar la campaña';
              pendingError = new Error(message);
            } else if (eventType === 'complete') {
              setCampaign(payload.campaign as LinkedInCampaignOutput);
              isComplete = true;
            }
          } catch (streamError) {
            pendingError =
              streamError instanceof Error
                ? streamError
                : new Error('Respuesta de progreso inválida.');
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
        throw new Error('La transmisión finalizó sin entregar la guía docente.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo generar la campaña');
      setProgressStep(null);
      setProgressMessage(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <header className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">LinkedIn Content Architect</h1>
          <p className="text-gray-600">
            Convierte una gran idea en cinco posts virales y sus guiones de video listos para publicar
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column: Form */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-2xl font-semibold mb-4">Define tu campaña</h2>
            <ChatForm onSubmit={handleSubmit} disabled={loading} />
            
            {error && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                {error}
              </div>
            )}
          </div>

          {/* Right Column: Progress and Preview */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-2xl font-semibold mb-4">Progreso de generación</h2>
            
            {loading && <Progress currentStep={progressStep} message={progressMessage} />}
            
            {campaign && (
              <div className="mt-6">
                <h3 className="text-xl font-semibold mb-4">Campaña lista para publicar</h3>
                <Preview
                  campaignTitle={campaign.campaignTitle}
                  toneRecipe={campaign.toneRecipe}
                  hookPrinciples={campaign.hookPrinciples}
                  angles={campaign.angles}
                  posts={campaign.posts}
                  markdown={campaign.markdown}
                  html={campaign.html}
                  meta={campaign.meta}
                />
              </div>
            )}

            {!loading && !campaign && (
              <div className="text-center text-gray-400 py-12">
                <p>Completa el formulario y haz clic en “Generar campaña viral” para comenzar</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

