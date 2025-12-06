'use client';

import { useState } from 'react';
import type { LessonPlanWithValidation, LessonProgramResponse } from '@/lib/schemas';

interface PreviewProps {
  program: LessonProgramResponse;
}

const badgeColors = {
  success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  warning: 'bg-amber-50 text-amber-700 border-amber-200',
  danger: 'bg-red-50 text-red-700 border-red-200',
};

function ChecklistBadge({ label, complete }: { label: string; complete: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold border ${
        complete ? badgeColors.success : badgeColors.warning
      }`}
    >
      <span>{complete ? '✅' : '⚠️'}</span>
      {label}
    </span>
  );
}

function ComplianceRow({ lesson }: { lesson: LessonPlanWithValidation }) {
  return (
    <div className="flex flex-wrap gap-2">
      <ChecklistBadge label="Montessori" complete={lesson.validation.montessoriComplete} />
      <ChecklistBadge label="Constructivist" complete={lesson.validation.constructivistComplete} />
      <ChecklistBadge label="Critical thinking" complete={lesson.validation.criticalThinkingComplete} />
      <ChecklistBadge label="English only" complete={lesson.validation.englishOnly} />
    </div>
  );
}

function LessonCard({ lesson, index }: { lesson: LessonPlanWithValidation; index: number }) {
  return (
    <div className="bg-white border border-amber-100 shadow-sm rounded-xl p-5 flex flex-col gap-4 print:break-inside-avoid">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-wide text-amber-600">Lesson {index + 1}</p>
          <h4 className="text-xl font-semibold text-slate-900">{lesson.title}</h4>
        </div>
        <ComplianceRow lesson={lesson} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-amber-50 rounded-lg p-3 border border-amber-100">
          <h5 className="text-sm font-semibold text-amber-800">Objectives</h5>
          <ul className="mt-2 space-y-1 text-sm text-slate-800 list-disc list-inside">
            {lesson.objectives.map((item, idx) => (
              <li key={idx}>{item}</li>
            ))}
          </ul>
        </div>
        <div className="bg-amber-50 rounded-lg p-3 border border-amber-100">
          <h5 className="text-sm font-semibold text-amber-800">Materials</h5>
          <ul className="mt-2 space-y-1 text-sm text-slate-800 list-disc list-inside">
            {lesson.materials.map((item, idx) => (
              <li key={idx}>{item}</li>
            ))}
          </ul>
        </div>
        <div className="bg-amber-50 rounded-lg p-3 border border-amber-100">
          <h5 className="text-sm font-semibold text-amber-800">Assessment & reflection</h5>
          <p className="mt-2 text-sm text-slate-800 leading-relaxed">{lesson.assessment}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <div className="flex items-center justify-between">
            <h5 className="text-sm font-semibold text-slate-900">Activities (constructivist phases)</h5>
            <span className="text-xs text-amber-700 font-semibold">Hands-on required</span>
          </div>
          <dl className="mt-3 space-y-2 text-sm text-slate-800">
            <div>
              <dt className="font-semibold text-slate-900">Prior knowledge</dt>
              <dd>{lesson.activities.prior_knowledge}</dd>
            </div>
            <div>
              <dt className="font-semibold text-slate-900">Exploration</dt>
              <dd>{lesson.activities.exploration}</dd>
            </div>
            <div>
              <dt className="font-semibold text-slate-900">Concept building</dt>
              <dd>{lesson.activities.concept_building}</dd>
            </div>
            <div>
              <dt className="font-semibold text-slate-900">Reflection</dt>
              <dd>{lesson.activities.reflection}</dd>
            </div>
          </dl>
        </div>

        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <div className="flex items-center justify-between">
            <h5 className="text-sm font-semibold text-slate-900">Critical questions</h5>
            <span className="text-xs text-amber-700 font-semibold">Peer discussion</span>
          </div>
          <ul className="mt-3 space-y-2 text-sm text-slate-800 list-disc list-inside">
            {lesson.critical_questions.map((q, idx) => (
              <li key={idx}>{q}</li>
            ))}
          </ul>
        </div>
      </div>

      {lesson.validation.issues.length > 0 && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3">
          <p className="font-semibold">Validation notes</p>
          <ul className="list-disc list-inside mt-1 space-y-1">
            {lesson.validation.issues.map((issue, idx) => (
              <li key={idx}>{issue}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default function Preview({ program }: PreviewProps) {
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState<'pdf' | 'epub' | null>(null);

  const downloadMarkdown = () => {
    setDownloadError(null);
    const blob = new Blob([program.markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'lesson-plan.md';
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
        body: JSON.stringify({ html: program.html }),
      });

      if (!response.ok) {
        const contentType = response.headers.get('content-type') ?? '';
        let message = 'Unable to generate the PDF.';
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
      a.download = 'lesson-plan.pdf';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading PDF:', error);
      setDownloadError(error instanceof Error ? error.message : 'Unable to generate the PDF.');
    } finally {
      setDownloading(null);
    }
  };

  const downloadEPUB = async () => {
    setDownloadError(null);
    setDownloading('epub');

    try {
      const response = await fetch('/api/export/epub', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markdown: program.markdown, title: program.weeklyTheme, meta: program.meta }),
      });

      if (!response.ok) {
        const contentType = response.headers.get('content-type') ?? '';
        let message = 'Unable to generate the EPUB.';
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
      a.download = 'lesson-plan.epub';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading EPUB:', error);
      setDownloadError(error instanceof Error ? error.message : 'Unable to generate the EPUB.');
    } finally {
      setDownloading(null);
    }
  };

  return (
    <div className="w-full space-y-6">
      <div className="grid gap-4 print:grid-cols-2 print:items-start">
        <div className="bg-white border border-amber-100 rounded-xl p-5 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-amber-700 font-semibold">Weekly theme</p>
          <h2 className="text-3xl font-bold text-slate-900 mb-2">{program.weeklyTheme}</h2>
          <p className="text-sm text-slate-700 leading-relaxed">{program.overview}</p>

          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-slate-800">
            <div className="flex flex-col gap-1">
              <span className="text-xs uppercase tracking-wide text-slate-500">Subject area</span>
              <span className="font-semibold text-slate-900">{program.meta.subjectArea}</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs uppercase tracking-wide text-slate-500">Grade level</span>
              <span className="font-semibold text-slate-900">{program.meta.gradeLevel}</span>
            </div>
            {program.meta.learnerProfile && (
              <div className="flex flex-col gap-1 sm:col-span-2">
                <span className="text-xs uppercase tracking-wide text-slate-500">Learner profile</span>
                <span className="text-slate-800">{program.meta.learnerProfile}</span>
              </div>
            )}
            {program.meta.constraints && (
              <div className="flex flex-col gap-1 sm:col-span-2">
                <span className="text-xs uppercase tracking-wide text-slate-500">Constraints</span>
                <span className="text-slate-800">{program.meta.constraints}</span>
              </div>
            )}
          </div>
        </div>

        <div className="bg-amber-50 border border-amber-100 rounded-xl p-5 shadow-sm flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wide text-amber-700 font-semibold">Template</p>
              <p className="text-sm text-slate-700">{program.template.lesson}</p>
            </div>
            <div className="flex flex-col items-end gap-1 text-xs text-slate-600">
              <span className="px-2 py-1 bg-white border border-amber-200 rounded-full font-semibold">English enforced</span>
              <span className="px-2 py-1 bg-white border border-amber-200 rounded-full font-semibold">
                Validation: {program.validation.lessonsPassed}/{program.validation.totalLessons} lessons pass
              </span>
            </div>
          </div>
          {program.validation.blockingIssues.length > 0 && (
            <div className={`border rounded-lg text-sm p-3 ${badgeColors.danger}`}>
              <p className="font-semibold">Validation issues</p>
              <ul className="list-disc list-inside space-y-1">
                {program.validation.blockingIssues.map((issue, idx) => (
                  <li key={idx}>{issue}</li>
                ))}
              </ul>
            </div>
          )}
          <div className="flex flex-wrap gap-2">
            <ChecklistBadge label="Montessori" complete={program.lessons.every((l) => l.validation.montessoriComplete)} />
            <ChecklistBadge
              label="Constructivist"
              complete={program.lessons.every((l) => l.validation.constructivistComplete)}
            />
            <ChecklistBadge
              label="Critical thinking"
              complete={program.lessons.every((l) => l.validation.criticalThinkingComplete)}
            />
            <ChecklistBadge label="English only" complete={program.validation.englishOnly} />
          </div>
        </div>
      </div>

      <div className="flex gap-3 flex-wrap">
        <button
          onClick={downloadMarkdown}
          className="px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={downloading !== null}
        >
          Download .md
        </button>
        <button
          onClick={downloadPDF}
          className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={downloading !== null}
        >
          {downloading === 'pdf' ? 'Generating PDF...' : 'Download .pdf'}
        </button>
        <button
          onClick={downloadEPUB}
          className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={downloading !== null}
        >
          {downloading === 'epub' ? 'Generating EPUB...' : 'Download .epub'}
        </button>
        {downloadError && (
          <span className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">{downloadError}</span>
        )}
      </div>

      <div className="grid gap-4">
        {program.lessons.map((lesson, idx) => (
          <LessonCard key={lesson.title} lesson={lesson} index={idx} />
        ))}
      </div>
    </div>
  );
}
