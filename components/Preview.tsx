'use client';

import { useState, useMemo } from 'react';
import type { SingleLessonResponse } from '@/lib/schemas';
import Icon from './Icon';

interface PreviewProps {
  lesson: SingleLessonResponse;
}

type SectionIconName =
  | 'compass'
  | 'book'
  | 'chalkboard'
  | 'lightbulb'
  | 'warning'
  | 'message'
  | 'sheet'
  | 'ticket'
  | 'users'
  | 'gift';

const SECTION_LABELS = {
  es: {
    overview: 'Vista general',
    content: 'Contenido y vocabulario',
    phases: 'Guión por fases',
    examples: 'Ejemplos resueltos',
    misconceptions: 'Errores conceptuales',
    dialogue: 'Preguntas para el aula',
    worksheet: 'Hoja de trabajo',
    exit: 'Ticket de salida',
    differentiation: 'Diferenciación',
    extension: 'Extensión',
    montessori: 'Montessori',
    constructivist: 'Constructivista',
    critical: 'Pensamiento crítico',
    learning_goal: 'Objetivo de aprendizaje',
    why: 'Por qué importa',
    prereq: 'Prerrequisitos',
    explanation: 'Explicación principal',
    key_concepts: 'Conceptos clave',
    vocab: 'Vocabulario',
    analogies: 'Analogías',
    teacher_script: 'Guión del maestro',
    student_actions: 'Qué hacen los alumnos',
    materials: 'Materiales',
    transition: 'Transición',
    steps: 'Pasos',
    mistakes: 'Errores comunes',
    teacher_note: 'Nota para el maestro',
    correction: 'Corrección',
    diagnostic: 'Pregunta diagnóstica',
    responses: 'Respuestas esperadas',
    follow_up: 'Cómo seguir',
    instructions: 'Consigna',
    answer: 'Respuesta',
    difficulty: 'Dificultad',
    rubric: 'Rúbrica',
    struggling: 'Para alumnos con dificultades',
    advanced: 'Para alumnos avanzados',
    accommodations: 'Adaptaciones',
    homework: 'Tarea',
    parent_note: 'Nota para padres',
    follow_up_lesson: 'Próxima clase',
    download_md: 'Markdown',
    download_pdf: 'PDF',
    download_docx: 'Word / Google Docs',
    download_epub: 'EPUB',
    copy: 'Copiar',
    copied: '¡Copiado!',
    print: 'Imprimir',
    minutes: 'min',
    duration: 'Duración',
    grade: 'Grado',
    subject: 'Materia',
    badge_ready: 'Lista para imprimir',
    difficulty_easy: 'Fácil',
    difficulty_medium: 'Medio',
    difficulty_hard: 'Difícil',
  },
  en: {
    overview: 'Overview',
    content: 'Content & vocabulary',
    phases: 'Phase-by-phase script',
    examples: 'Worked examples',
    misconceptions: 'Common misconceptions',
    dialogue: 'Classroom dialogue prompts',
    worksheet: 'Worksheet',
    exit: 'Exit ticket',
    differentiation: 'Differentiation',
    extension: 'Extension',
    montessori: 'Montessori',
    constructivist: 'Constructivist',
    critical: 'Critical thinking',
    learning_goal: 'Learning goal',
    why: 'Why it matters',
    prereq: 'Prerequisites',
    explanation: 'Main explanation',
    key_concepts: 'Key concepts',
    vocab: 'Vocabulary',
    analogies: 'Analogies',
    teacher_script: 'Teacher script',
    student_actions: 'Student actions',
    materials: 'Materials',
    transition: 'Transition',
    steps: 'Steps',
    mistakes: 'Common mistakes',
    teacher_note: 'Teacher note',
    correction: 'Correction',
    diagnostic: 'Diagnostic question',
    responses: 'Expected responses',
    follow_up: 'Teacher follow-up',
    instructions: 'Instructions',
    answer: 'Answer',
    difficulty: 'Difficulty',
    rubric: 'Rubric',
    struggling: 'For struggling learners',
    advanced: 'For advanced learners',
    accommodations: 'Accommodations',
    homework: 'Homework',
    parent_note: 'Parent note',
    follow_up_lesson: 'Next class idea',
    download_md: 'Markdown',
    download_pdf: 'PDF',
    download_docx: 'Word / Google Docs',
    download_epub: 'EPUB',
    copy: 'Copy',
    copied: 'Copied!',
    print: 'Print',
    minutes: 'min',
    duration: 'Duration',
    grade: 'Grade',
    subject: 'Subject',
    badge_ready: 'Ready to print',
    difficulty_easy: 'Easy',
    difficulty_medium: 'Medium',
    difficulty_hard: 'Hard',
  },
} as const;

const DIFFICULTY_STYLE: Record<'easy' | 'medium' | 'hard', string> = {
  easy: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  medium: 'bg-amber-50 text-amber-700 border-amber-200',
  hard: 'bg-rose-50 text-rose-700 border-rose-200',
};

function Section({
  number,
  title,
  icon,
  defaultOpen = false,
  children,
  badge,
}: {
  number: number;
  title: string;
  icon: SectionIconName;
  defaultOpen?: boolean;
  children: React.ReactNode;
  badge?: string;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="bg-white border border-ink-100 rounded-2xl shadow-soft overflow-hidden print:shadow-none print:border-ink-200 transition-all duration-200">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-3 px-5 py-4 text-left hover:bg-brand-50/40 transition-colors"
      >
        <div className="flex items-center gap-3.5 min-w-0">
          <span className="flex-none w-9 h-9 rounded-xl bg-gradient-to-br from-accent-400 to-accent-600 text-white flex items-center justify-center font-bold text-sm shadow-coral">
            {number}
          </span>
          <span className="flex-none text-brand-600">
            <Icon name={icon} size={20} strokeWidth={1.8} />
          </span>
          <h3 className="font-display text-base sm:text-lg font-bold text-ink-900 truncate">{title}</h3>
        </div>
        <div className="flex items-center gap-2 flex-none">
          {badge && (
            <span className="text-xs font-semibold text-brand-700 bg-brand-50 border border-brand-100 px-2.5 py-1 rounded-full">
              {badge}
            </span>
          )}
          <Icon
            name="chevron"
            size={16}
            className={`text-ink-400 transition-transform duration-200 ${open ? 'rotate-90' : ''}`}
          />
        </div>
      </button>
      <div
        className={`px-5 pb-5 pt-1 space-y-3 text-sm text-ink-700 ${
          open ? 'animate-fade-in' : 'hidden print:block'
        }`}
      >
        {children}
      </div>
    </div>
  );
}

function PedagogyBadge({ label, active }: { label: string; active: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${
        active
          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
          : 'bg-ink-100 text-ink-500 border-ink-200'
      }`}
    >
      {active ? <Icon name="check" size={12} strokeWidth={2.6} /> : <span className="w-1.5 h-1.5 rounded-full bg-current opacity-50" />}
      {label}
    </span>
  );
}

export default function Preview({ lesson }: PreviewProps) {
  const lang = (lesson.meta.language ?? 'es') as 'es' | 'en';
  const t = SECTION_LABELS[lang];

  const [downloading, setDownloading] = useState<'pdf' | 'epub' | 'docx' | null>(null);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [copyNotice, setCopyNotice] = useState<string | null>(null);

  const totalPhaseMinutes = useMemo(
    () => lesson.phases.reduce((sum, p) => sum + p.duration_min, 0),
    [lesson.phases]
  );

  const difficultyLabel = (d: 'easy' | 'medium' | 'hard') => {
    if (d === 'easy') return t.difficulty_easy;
    if (d === 'medium') return t.difficulty_medium;
    return t.difficulty_hard;
  };

  const downloadMarkdown = () => {
    const blob = new Blob([lesson.markdown], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${lesson.title.replace(/[^a-zA-Z0-9-]+/g, '_').toLowerCase()}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const downloadBinary = async (kind: 'pdf' | 'epub' | 'docx') => {
    setDownloadError(null);
    setDownloading(kind);
    try {
      const response = await fetch(`/api/export/${kind}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          markdown: lesson.markdown,
          html: lesson.html,
          title: lesson.title,
          meta: lesson.meta,
          lesson,
        }),
      });
      if (!response.ok) {
        const contentType = response.headers.get('content-type') ?? '';
        let message = `Unable to generate the ${kind.toUpperCase()}.`;
        if (contentType.includes('application/json')) {
          try {
            const errorData = await response.json();
            message = errorData.error || errorData.details || message;
          } catch {
            /* ignore */
          }
        }
        throw new Error(message);
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${lesson.title.replace(/[^a-zA-Z0-9-]+/g, '_').toLowerCase()}.${kind}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      setDownloadError(error instanceof Error ? error.message : 'Download failed.');
    } finally {
      setDownloading(null);
    }
  };

  const copyAll = async () => {
    await navigator.clipboard.writeText(lesson.markdown);
    setCopyNotice(t.copied);
    setTimeout(() => setCopyNotice(null), 2000);
  };

  return (
    <div className="w-full space-y-4">
      {/* Header card */}
      <div className="relative overflow-hidden rounded-3xl border border-brand-100 shadow-soft bg-gradient-to-br from-brand-50 via-white to-accent-50/50 p-6">
        <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-brand-200 opacity-30 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-48 h-48 rounded-full bg-accent-200 opacity-30 blur-3xl pointer-events-none" />
        <div className="relative">
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-brand-700 bg-white/80 border border-brand-100 rounded-full px-3 py-1 mb-3">
            <Icon name="sparkle" size={12} />
            {t.badge_ready}
          </div>
          <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-ink-900 mb-1 leading-tight tracking-tight">
            {lesson.title}
          </h2>
          {lesson.subtitle && <p className="text-sm italic text-ink-600 mb-3">{lesson.subtitle}</p>}
          <div className="flex flex-wrap gap-x-5 gap-y-1.5 text-sm text-ink-700 mt-3">
            <span className="inline-flex items-center gap-1.5">
              <Icon name="clock" size={14} className="text-brand-600" />
              <span className="font-medium">{lesson.meta.duration_min} {t.minutes}</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Icon name="users" size={14} className="text-brand-600" />
              <span className="font-medium">{lesson.meta.grade_level}</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Icon name="book" size={14} className="text-brand-600" />
              <span className="font-medium">{lesson.meta.subject}</span>
            </span>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <PedagogyBadge label={t.montessori} active={lesson.validation.montessoriComplete} />
            <PedagogyBadge label={t.constructivist} active={lesson.validation.constructivistComplete} />
            <PedagogyBadge label={t.critical} active={lesson.validation.criticalThinkingComplete} />
            {lesson.meta.sourceFilename && (
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border bg-white text-brand-700 border-brand-200">
                <Icon name="sheet" size={12} />
                {lang === 'es' ? 'Basado en' : 'Based on'}{' '}
                <span className="font-bold truncate max-w-[180px]">{lesson.meta.sourceFilename}</span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-2 items-center no-print">
        <button
          onClick={() => downloadBinary('docx')}
          disabled={downloading !== null}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold bg-gradient-brand text-white rounded-xl shadow-pop hover:shadow-glow hover:-translate-y-0.5 transition-all disabled:opacity-60 disabled:translate-y-0"
          title={lang === 'es' ? 'Abre en Word, Google Docs o Pages' : 'Opens in Word, Google Docs or Pages'}
        >
          {downloading === 'docx' ? (
            <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <Icon name="download" size={14} />
          )}
          {t.download_docx}
        </button>
        <button
          onClick={downloadMarkdown}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold bg-white text-ink-800 border border-ink-200 rounded-xl hover:bg-ink-50 hover:border-ink-300 transition-colors"
        >
          <Icon name="download" size={14} />
          {t.download_md}
        </button>
        <button
          onClick={() => downloadBinary('epub')}
          disabled={downloading !== null}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold bg-white text-ink-800 border border-ink-200 rounded-xl hover:bg-ink-50 hover:border-ink-300 transition-colors disabled:opacity-60"
        >
          {downloading === 'epub' ? (
            <span className="w-3.5 h-3.5 border-2 border-ink-300 border-t-ink-700 rounded-full animate-spin" />
          ) : (
            <Icon name="download" size={14} />
          )}
          {t.download_epub}
        </button>
        <button
          onClick={copyAll}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold bg-white text-ink-800 border border-ink-200 rounded-xl hover:bg-ink-50 hover:border-ink-300 transition-colors"
        >
          <Icon name="copy" size={14} />
          {t.copy}
        </button>
        {downloadError && (
          <span className="text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-3 py-1.5">
            {downloadError}
          </span>
        )}
        {copyNotice && (
          <span className="text-sm font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-1.5 animate-fade-in">
            {copyNotice}
          </span>
        )}
      </div>

      {/* Sections */}
      <Section number={1} title={t.overview} icon="compass" defaultOpen>
        <div className="bg-brand-50/50 border border-brand-100 rounded-xl p-3.5">
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-700 mb-1">{t.learning_goal}</p>
          <p className="text-ink-900 leading-relaxed">{lesson.overview.learning_goal}</p>
        </div>
        <div className="bg-accent-50/50 border border-accent-100 rounded-xl p-3.5">
          <p className="text-xs font-semibold uppercase tracking-wide text-accent-700 mb-1">{t.why}</p>
          <p className="text-ink-800 leading-relaxed">{lesson.overview.why_it_matters}</p>
        </div>
        {lesson.overview.prerequisites.length > 0 && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-500 mb-2">{t.prereq}</p>
            <ul className="space-y-1">
              {lesson.overview.prerequisites.map((p, i) => (
                <li key={i} className="flex items-start gap-2">
                  <Icon name="check" size={14} className="text-emerald-600 mt-0.5 flex-none" strokeWidth={2.4} />
                  <span>{p}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </Section>

      <Section number={2} title={t.content} icon="book">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-500 mb-2">{t.explanation}</p>
          <p className="whitespace-pre-wrap leading-relaxed text-ink-800">{lesson.core_content.main_explanation}</p>
        </div>
        <div className="mt-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-500 mb-2">{t.key_concepts}</p>
          <ul className="space-y-2">
            {lesson.core_content.key_concepts.map((c, i) => (
              <li key={i} className="bg-white border border-ink-100 rounded-xl p-3">
                <p className="font-semibold text-brand-700">{c.name}</p>
                <p className="text-ink-700 text-sm leading-relaxed mt-0.5">{c.definition}</p>
                <p className="text-xs italic text-ink-500 mt-1">{c.why_it_matters}</p>
              </li>
            ))}
          </ul>
        </div>
        <div className="mt-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-500 mb-2">{t.vocab}</p>
          <ul className="space-y-2">
            {lesson.core_content.vocabulary.map((v, i) => (
              <li key={i} className="border-l-2 border-accent-300 pl-3">
                <p>
                  <strong className="text-ink-900">{v.term}:</strong>{' '}
                  <span className="text-ink-700">{v.definition}</span>
                </p>
                <p className="text-xs italic text-ink-500 mt-0.5">&ldquo;{v.example_in_context}&rdquo;</p>
              </li>
            ))}
          </ul>
        </div>
        <div className="mt-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-500 mb-2">{t.analogies}</p>
          <ul className="space-y-1.5">
            {lesson.core_content.analogies.map((a, i) => (
              <li key={i} className="flex items-start gap-2">
                <Icon name="lightbulb" size={14} className="text-accent-500 mt-0.5 flex-none" />
                <span>
                  {a.analogy} <span className="text-ink-500">→ {a.what_it_illustrates}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      </Section>

      <Section number={3} title={t.phases} icon="chalkboard" defaultOpen badge={`${totalPhaseMinutes} ${t.minutes}`}>
        <div className="space-y-3">
          {lesson.phases.map((phase, idx) => (
            <div key={idx} className="rounded-2xl border border-brand-100 bg-gradient-to-br from-brand-50/50 to-white p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-display font-bold text-ink-900 capitalize">
                  {idx + 1}. {phase.name}
                </h4>
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-accent-700 bg-accent-50 border border-accent-200 px-2 py-0.5 rounded-full">
                  <Icon name="clock" size={11} />
                  {phase.duration_min} {t.minutes}
                </span>
              </div>
              <div className="bg-white border-l-4 border-brand-500 rounded-r-xl p-3.5 mb-3 shadow-soft">
                <p className="text-[11px] uppercase font-bold tracking-wider text-brand-700 mb-1.5">
                  {t.teacher_script}
                </p>
                <p className="whitespace-pre-wrap leading-relaxed text-ink-800">{phase.teacher_script}</p>
              </div>
              <p className="text-sm">
                <strong className="text-ink-900">{t.student_actions}:</strong>{' '}
                <span className="text-ink-700">{phase.student_actions}</span>
              </p>
              {phase.materials_used.length > 0 && (
                <p className="text-sm mt-1">
                  <strong className="text-ink-900">{t.materials}:</strong>{' '}
                  <span className="text-ink-700">{phase.materials_used.join(', ')}</span>
                </p>
              )}
              <p className="text-sm text-ink-500 italic mt-2">
                <strong className="text-ink-700 not-italic">{t.transition}:</strong> {phase.transitions}
              </p>
            </div>
          ))}
        </div>
      </Section>

      <Section number={4} title={t.examples} icon="lightbulb">
        <div className="space-y-3">
          {lesson.worked_examples.map((ex, idx) => (
            <div key={idx} className="bg-ink-50 border border-ink-100 rounded-2xl p-4">
              <p className="font-semibold text-ink-900 mb-2">
                <span className="text-accent-600 mr-1">#{idx + 1}</span>
                {ex.example}
              </p>
              <div className="mb-2">
                <p className="text-[11px] uppercase font-bold tracking-wider text-brand-700 mb-1.5">{t.steps}</p>
                <ol className="space-y-1.5">
                  {ex.solution_steps.map((s, i) => (
                    <li key={i} className="flex gap-2">
                      <span className="flex-none w-5 h-5 bg-brand-100 text-brand-700 rounded-full text-xs font-bold flex items-center justify-center">
                        {i + 1}
                      </span>
                      <span className="text-ink-800">{s}</span>
                    </li>
                  ))}
                </ol>
              </div>
              {ex.common_mistakes.length > 0 && (
                <div className="mt-3 bg-rose-50/60 border border-rose-100 rounded-xl p-3">
                  <p className="text-[11px] uppercase font-bold tracking-wider text-rose-700 mb-1.5 flex items-center gap-1">
                    <Icon name="warning" size={12} />
                    {t.mistakes}
                  </p>
                  <ul className="space-y-1 text-sm text-rose-900">
                    {ex.common_mistakes.map((m, i) => (
                      <li key={i}>· {m}</li>
                    ))}
                  </ul>
                </div>
              )}
              <p className="mt-3 text-xs italic text-ink-600 border-t border-ink-200 pt-2">
                <strong className="not-italic text-ink-800">{t.teacher_note}:</strong> {ex.teacher_note}
              </p>
            </div>
          ))}
        </div>
      </Section>

      <Section number={5} title={t.misconceptions} icon="warning">
        <ul className="space-y-3">
          {lesson.common_misconceptions.map((m, i) => (
            <li key={i} className="border-l-4 border-rose-300 bg-rose-50/40 rounded-r-xl p-3.5">
              <p className="font-semibold text-rose-800">{m.misconception}</p>
              <p className="mt-1 text-ink-800">
                <strong className="text-emerald-700">{t.correction}:</strong> {m.correction}
              </p>
              <p className="text-xs italic text-ink-500 mt-1.5">
                {t.diagnostic}: &ldquo;{m.diagnostic_question}&rdquo;
              </p>
            </li>
          ))}
        </ul>
      </Section>

      <Section number={6} title={t.dialogue} icon="message">
        <div className="space-y-3">
          {lesson.dialogue_prompts.map((d, idx) => (
            <div key={idx} className="bg-white border border-ink-100 rounded-xl p-3.5">
              <p className="font-semibold text-ink-900">
                <span className="text-brand-600 mr-1">Q{idx + 1}.</span>
                {d.question}
              </p>
              <div className="mt-2">
                <p className="text-[11px] uppercase font-bold tracking-wider text-ink-500 mb-1">{t.responses}</p>
                <ul className="space-y-0.5 text-sm text-ink-700">
                  {d.expected_responses.map((r, i) => (
                    <li key={i}>• {r}</li>
                  ))}
                </ul>
              </div>
              <p className="mt-2 text-sm text-ink-700">
                <strong className="text-ink-900">{t.follow_up}:</strong> {d.teacher_follow_up}
              </p>
            </div>
          ))}
        </div>
      </Section>

      <Section number={7} title={t.worksheet} icon="sheet" badge={`${lesson.worksheet.problems.length} ej.`}>
        <p className="italic text-ink-600 mb-3 bg-brand-50 border border-brand-100 rounded-xl px-3 py-2">
          {lesson.worksheet.instructions}
        </p>
        <ol className="space-y-2.5">
          {lesson.worksheet.problems.map((p) => (
            <li key={p.number} className="bg-white border border-ink-100 rounded-xl p-3.5">
              <div className="flex items-start justify-between gap-2 mb-1.5">
                <p className="text-ink-900">
                  <span className="font-bold text-accent-600 mr-1">{p.number}.</span>
                  {p.prompt}
                </p>
                <span className={`flex-none text-xs font-semibold px-2 py-0.5 rounded-full border ${DIFFICULTY_STYLE[p.difficulty]}`}>
                  {difficultyLabel(p.difficulty)}
                </span>
              </div>
              <div className="bg-emerald-50/60 border border-emerald-100 rounded-lg px-3 py-1.5 text-sm">
                <strong className="text-emerald-800">{t.answer}:</strong>{' '}
                <span className="text-emerald-900">{p.answer}</span>
              </div>
            </li>
          ))}
        </ol>
      </Section>

      <Section number={8} title={t.exit} icon="ticket">
        <ol className="space-y-2.5">
          {lesson.exit_ticket.questions.map((q, i) => (
            <li key={i} className="bg-white border border-ink-100 rounded-xl p-3">
              <p className="text-ink-900">
                <span className="font-bold text-brand-600 mr-1">{i + 1}.</span>
                {q.prompt}
              </p>
              <p className="text-sm text-emerald-800 mt-1.5">
                <strong>{t.answer}:</strong> <span className="text-emerald-900">{q.answer}</span>
              </p>
            </li>
          ))}
        </ol>
        <div className="bg-brand-50/50 border border-brand-100 rounded-xl p-3 mt-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-700 mb-0.5">{t.rubric}</p>
          <p className="text-sm text-ink-800">{lesson.exit_ticket.grading_rubric}</p>
        </div>
      </Section>

      <Section number={9} title={t.differentiation} icon="users">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="bg-amber-50/60 border border-amber-100 rounded-xl p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-amber-700 mb-1">{t.struggling}</p>
            <p className="text-sm text-ink-800">{lesson.differentiation.for_struggling}</p>
          </div>
          <div className="bg-brand-50/60 border border-brand-100 rounded-xl p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-brand-700 mb-1">{t.advanced}</p>
            <p className="text-sm text-ink-800">{lesson.differentiation.for_advanced}</p>
          </div>
          <div className="bg-emerald-50/60 border border-emerald-100 rounded-xl p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700 mb-1">{t.accommodations}</p>
            <p className="text-sm text-ink-800">{lesson.differentiation.accommodations}</p>
          </div>
        </div>
      </Section>

      <Section number={10} title={t.extension} icon="gift">
        {lesson.extension.homework && (
          <div className="bg-accent-50/60 border border-accent-100 rounded-xl p-3.5">
            <p className="text-xs font-semibold uppercase tracking-wide text-accent-700 mb-1">
              {t.homework} · {lesson.extension.homework.expected_time_min} {t.minutes}
            </p>
            <p className="text-ink-800">{lesson.extension.homework.description}</p>
          </div>
        )}
        {lesson.extension.parent_note && (
          <div className="bg-white border border-ink-100 rounded-xl p-3.5">
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-500 mb-2">{t.parent_note}</p>
            <blockquote className="border-l-2 border-accent-300 pl-3 italic text-ink-700 whitespace-pre-wrap">
              {lesson.extension.parent_note}
            </blockquote>
          </div>
        )}
        <div className="bg-brand-50/50 border border-brand-100 rounded-xl p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-700 mb-1">{t.follow_up_lesson}</p>
          <p className="text-ink-800">{lesson.extension.follow_up_lesson_idea}</p>
        </div>
      </Section>
    </div>
  );
}
