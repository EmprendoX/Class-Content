'use client';

import { useState } from 'react';
import type { CampaignAngle, CampaignPostWithVideo } from '@/lib/schemas';

interface PreviewProps {
  campaignTitle: string;
  toneRecipe: string;
  hookPrinciples: string[];
  angles: CampaignAngle[];
  posts: CampaignPostWithVideo[];
  markdown: string;
  html: string;
  meta: {
    mainTheme: string;
    audienceProfile: string;
    campaignGoal: string;
    brandVoice?: string;
    callToAction?: string;
    offerDescription?: string;
    contextNotes?: string;
    generatedAt: string;
  };
}

type Tab = 'posts' | 'markdown' | 'html';

const tabLabels: Record<Tab, string> = {
  posts: 'Posts y guiones',
  markdown: 'Markdown',
  html: 'Vista',
};

export default function Preview({
  campaignTitle,
  toneRecipe,
  hookPrinciples,
  angles,
  posts,
  markdown,
  html,
  meta,
}: PreviewProps) {
  const [activeTab, setActiveTab] = useState<Tab>('posts');
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState<'pdf' | 'epub' | null>(null);

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      alert('Copiado al portapapeles');
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const downloadMarkdown = () => {
    setDownloadError(null);
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'linkedin-campaign.md';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const downloadPDF = async () => {
    setDownloadError(null);
    setDownloading('pdf');

    try {
      const response = await fetch('/api/export/pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ html }),
      });

      if (!response.ok) {
        const contentType = response.headers.get('content-type') ?? '';
        let message = 'No se pudo generar el PDF.';
        if (contentType.includes('application/json')) {
          try {
            const errorData = await response.json();
            message = errorData.error || errorData.details || message;
          } catch {
            // ignore parse errors
          }
        }
        throw new Error(message);
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'linkedin-campaign.pdf';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading PDF:', error);
      setDownloadError(
        error instanceof Error ? error.message : 'No se pudo generar el PDF.'
      );
    } finally {
      setDownloading(null);
    }
  };

  const downloadEPUB = async () => {
    setDownloadError(null);
    setDownloading('epub');

    try {
      const title = campaignTitle || 'LinkedIn Campaign';
      const response = await fetch('/api/export/epub', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markdown, title, meta: { title } }),
      });

      if (!response.ok) {
        const contentType = response.headers.get('content-type') ?? '';
        let message = 'No se pudo generar el EPUB.';
        if (contentType.includes('application/json')) {
          try {
            const errorData = await response.json();
            message = errorData.error || errorData.details || message;
          } catch {
            // ignore parse errors
          }
        }
        throw new Error(message);
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'linkedin-campaign.epub';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading EPUB:', error);
      setDownloadError(
        error instanceof Error ? error.message : 'No se pudo generar el EPUB.'
      );
    } finally {
      setDownloading(null);
    }
  };

  const sortedAngles = [...angles].sort((a, b) => a.id - b.id);
  const sortedPosts = [...posts].sort((a, b) => a.angleId - b.angleId);

  return (
    <div className="w-full">
      <div className="grid gap-4 mb-6">
        <div className="bg-white border border-blue-100 rounded-lg p-4 shadow-sm">
          <h2 className="text-2xl font-bold text-blue-900 mb-2">{campaignTitle}</h2>
          <p className="text-sm text-blue-900">
            <span className="font-semibold">Tema:</span> {meta.mainTheme}
          </p>
          <p className="text-sm text-blue-900">
            <span className="font-semibold">Objetivo:</span> {meta.campaignGoal}
          </p>
          <p className="text-sm text-blue-900">
            <span className="font-semibold">Audiencia:</span> {meta.audienceProfile}
          </p>
          {meta.brandVoice ? (
            <p className="text-sm text-blue-900">
              <span className="font-semibold">Voz:</span> {meta.brandVoice}
            </p>
          ) : null}
          {meta.callToAction ? (
            <p className="text-sm text-blue-900">
              <span className="font-semibold">CTA:</span> {meta.callToAction}
            </p>
          ) : null}
          {meta.offerDescription ? (
            <p className="text-sm text-blue-900">
              <span className="font-semibold">Oferta:</span> {meta.offerDescription}
            </p>
          ) : null}
          {meta.contextNotes ? (
            <p className="text-sm text-blue-900 whitespace-pre-wrap mt-2">
              <span className="font-semibold">Contexto:</span> {meta.contextNotes}
            </p>
          ) : null}
        </div>

        <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">Receta de tono</h3>
          <p className="text-sm text-blue-900 leading-relaxed whitespace-pre-wrap">{toneRecipe}</p>

          <div className="mt-4">
            <h4 className="text-sm font-semibold text-blue-800 uppercase tracking-wide">
              Principios de hook
            </h4>
            <ul className="mt-2 space-y-1 text-sm text-blue-900">
              {hookPrinciples.map((hook, index) => (
                <li key={index} className="flex gap-2">
                  <span className="text-blue-600">•</span>
                  <span>{hook}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Ángulos de la campaña</h3>
          <div className="space-y-3">
            {sortedAngles.map((angle) => (
              <div key={angle.id} className="border border-gray-100 rounded-lg p-3 bg-gray-50">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-gray-500">Ángulo {angle.id}</p>
                    <h4 className="text-base font-semibold text-gray-900">{angle.title}</h4>
                  </div>
                  <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                    {angle.postType}
                  </span>
                </div>
                <p className="text-sm text-gray-700 mt-2">{angle.promise}</p>
                <ul className="mt-3 space-y-1 text-sm text-gray-700">
                  {angle.keyPoints.map((point, index) => (
                    <li key={index} className="flex gap-2">
                      <span className="text-blue-500">→</span>
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
                <p className="text-xs text-gray-500 mt-3">
                  <span className="font-semibold">Por qué funciona:</span> {angle.whyItWorks}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Export Buttons */}
      <div className="flex gap-2 mb-4 flex-wrap">
        <button
          onClick={downloadMarkdown}
          className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={downloading !== null}
        >
          Descargar .md
        </button>
        <button
          onClick={downloadPDF}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={downloading !== null}
        >
          {downloading === 'pdf' ? 'Generando PDF...' : 'Descargar .pdf'}
        </button>
        <button
          onClick={downloadEPUB}
          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={downloading !== null}
        >
          {downloading === 'epub' ? 'Generando EPUB...' : 'Descargar .epub'}
        </button>
      </div>

      {downloadError && (
        <div className="w-full mb-4 px-4 py-2 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
          {downloadError}
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-4">
        <nav className="flex gap-4">
          {(['posts', 'markdown', 'html'] as Tab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-2 px-4 font-medium border-b-2 transition-colors ${
                activeTab === tab
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tabLabels[tab]}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-4">
        {activeTab === 'posts' && (
          <div className="space-y-6">
            {sortedPosts.map((post, index) => (
              <div key={post.angleId} className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="bg-gray-50 px-4 py-3 flex items-center justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-gray-500">Post {index + 1}</p>
                    <h4 className="text-lg font-semibold text-gray-900">
                      {post.angleTitle}
                    </h4>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => copyToClipboard(post.copyMarkdown)}
                      className="px-3 py-1 bg-gray-200 text-gray-700 rounded text-sm hover:bg-gray-300"
                    >
                      Copiar post
                    </button>
                    <button
                      onClick={() => copyToClipboard(post.videoScript.beats.map((beat) => `${beat.order}. ${beat.voiceOver}`).join('\n'))}
                      className="px-3 py-1 bg-blue-100 text-blue-700 rounded text-sm hover:bg-blue-200"
                    >
                      Copiar guion
                    </button>
                  </div>
                </div>

                <div className="p-4 space-y-4">
                  <div>
                    <h5 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                      Hook
                    </h5>
                    <p className="text-sm text-gray-800 mt-1">{post.hook}</p>
                  </div>

                  <div>
                    <h5 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                      Copy lista para pegar
                    </h5>
                    <pre className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-sm whitespace-pre-wrap">
{post.copyMarkdown}
                    </pre>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <h6 className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Insight clave
                      </h6>
                      <p className="text-sm text-gray-800 mt-1">{post.keyTakeaway}</p>
                    </div>
                    <div>
                      <h6 className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                        CTA
                      </h6>
                      <p className="text-sm text-gray-800 mt-1">{post.callToAction}</p>
                    </div>
                    <div>
                      <h6 className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Hashtags
                      </h6>
                      <p className="text-sm text-gray-800 mt-1">
                        {post.hashtags.map((tag) => `#${tag.replace(/^#/, '')}`).join(' ')}
                      </p>
                    </div>
                  </div>

                  <div>
                    <h5 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                      Video script ({post.videoScript.duration})
                    </h5>
                    <div className="mt-2 space-y-3">
                      {post.videoScript.beats.map((beat) => (
                        <div key={beat.order} className="border border-gray-100 rounded-lg p-3 bg-white">
                          <p className="text-xs font-semibold text-blue-600">Beat {beat.order}</p>
                          <p className="text-sm text-gray-900 mt-1">
                            <span className="font-semibold">Shot:</span> {beat.shot}
                          </p>
                          <p className="text-sm text-gray-900 mt-1">
                            <span className="font-semibold">Voice over:</span> {beat.voiceOver}
                          </p>
                          {beat.onScreenText ? (
                            <p className="text-sm text-gray-900 mt-1">
                              <span className="font-semibold">On-screen text:</span> {beat.onScreenText}
                            </p>
                          ) : null}
                          <p className="text-sm text-gray-900 mt-1">
                            <span className="font-semibold">Cámara:</span> {beat.cameraDirection}
                          </p>
                        </div>
                      ))}
                    </div>
                    <div className="mt-3 text-sm text-gray-800">
                      <p>
                        <span className="font-semibold">Hook hablado:</span> {post.videoScript.hook}
                      </p>
                      <p className="mt-1">
                        <span className="font-semibold">Cierre:</span> {post.videoScript.closing}
                      </p>
                      <p className="mt-1">
                        <span className="font-semibold">CTA final:</span> {post.videoScript.callToAction}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'markdown' && (
          <div className="relative">
            <div className="absolute top-2 right-2 flex gap-2">
              <button
                onClick={() => copyToClipboard(markdown)}
                className="px-3 py-1 bg-gray-100 text-gray-700 rounded text-sm hover:bg-gray-200"
              >
                Copiar Markdown
              </button>
            </div>
            <pre className="bg-gray-50 p-4 rounded-lg overflow-auto max-h-[600px] text-sm">
              <code>{markdown}</code>
            </pre>
          </div>
        )}

        {activeTab === 'html' && (
          <div className="prose max-w-none">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 max-h-[600px] overflow-y-auto space-y-6">
              <div dangerouslySetInnerHTML={{ __html: html }} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
