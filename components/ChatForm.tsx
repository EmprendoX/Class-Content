'use client';

import { useState, FormEvent } from 'react';
import Icon from './Icon';
import FileDropZone, { AttachedSource } from './FileDropZone';

export type LessonLanguage = 'es' | 'en';
export type LessonTone = 'ludico' | 'conversacional' | 'formal' | 'inspirador';
export type LessonUserType = 'maestro' | 'educador' | 'padre' | 'tutor';
export type LessonDuration = '30' | '45' | '60' | '90';

export interface LessonPlanForm {
  topic: string;
  subjectArea: string;
  gradeLevel: string;
  learningObjective?: string;
  learnerProfile?: string;
  constraints?: string;
  sourceMaterial?: string;
  sourceFilename?: string;
  language: LessonLanguage;
  tone: LessonTone;
  userType: LessonUserType;
  classDuration: LessonDuration;
}

interface ChatFormProps {
  onSubmit: (data: LessonPlanForm) => void;
  disabled?: boolean;
}

const inputClass =
  'w-full px-4 py-2.5 text-sm border border-ink-200 rounded-xl bg-white text-ink-900 placeholder:text-ink-400 transition-all duration-150 focus:outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-100 disabled:bg-ink-50 disabled:text-ink-500';

function Label({ htmlFor, children, optional }: { htmlFor: string; children: React.ReactNode; optional?: string }) {
  return (
    <label htmlFor={htmlFor} className="block text-sm font-semibold text-ink-800 mb-1.5">
      {children}
      {optional && <span className="ml-1 text-xs font-normal text-ink-400">{optional}</span>}
    </label>
  );
}

export default function ChatForm({ onSubmit, disabled }: ChatFormProps) {
  const [language, setLanguage] = useState<LessonLanguage>('es');
  const [topic, setTopic] = useState('');
  const [subjectArea, setSubjectArea] = useState('');
  const [gradeLevel, setGradeLevel] = useState('');
  const [tone, setTone] = useState<LessonTone>('conversacional');
  const [userType, setUserType] = useState<LessonUserType>('maestro');
  const [classDuration, setClassDuration] = useState<LessonDuration>('45');
  const [learningObjective, setLearningObjective] = useState('');
  const [learnerProfile, setLearnerProfile] = useState('');
  const [constraints, setConstraints] = useState('');
  const [attachedSource, setAttachedSource] = useState<AttachedSource | null>(null);

  const isSpanish = language === 'es';
  const t = (es: string, en: string) => (isSpanish ? es : en);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSubmit({
      topic: topic.trim(),
      subjectArea: subjectArea.trim(),
      gradeLevel: gradeLevel.trim(),
      learningObjective: learningObjective.trim() || undefined,
      learnerProfile: learnerProfile.trim() || undefined,
      constraints: constraints.trim() || undefined,
      sourceMaterial: attachedSource?.text,
      sourceFilename: attachedSource?.filename,
      language,
      tone,
      userType,
      classDuration,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Block 1: contexto del usuario */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="language">{t('Idioma de la clase', 'Output language')}</Label>
          <select
            id="language"
            value={language}
            onChange={(e) => setLanguage(e.target.value as LessonLanguage)}
            className={inputClass}
            disabled={disabled}
          >
            <option value="es">Español</option>
            <option value="en">English</option>
          </select>
        </div>

        <div>
          <Label htmlFor="userType">{t('¿Quién da la clase?', 'Who teaches?')}</Label>
          <select
            id="userType"
            value={userType}
            onChange={(e) => setUserType(e.target.value as LessonUserType)}
            className={inputClass}
            disabled={disabled}
          >
            <option value="maestro">{t('Maestro/a de escuela', 'Classroom teacher')}</option>
            <option value="educador">{t('Educador/a', 'Educator')}</option>
            <option value="padre">{t('Papá / Mamá en casa', 'Parent at home')}</option>
            <option value="tutor">{t('Tutor 1-a-1', 'One-on-one tutor')}</option>
          </select>
        </div>
      </div>

      {/* Block 1.5: material fuente opcional */}
      <div className="border-t border-ink-100 pt-5">
        <p className="block text-sm font-semibold text-ink-800 mb-1.5">
          {t('Material fuente', 'Source material')}{' '}
          <span className="ml-1 text-xs font-normal text-ink-400">{t('(opcional)', '(optional)')}</span>
        </p>
        <FileDropZone
          attached={attachedSource}
          onAttached={setAttachedSource}
          onClear={() => setAttachedSource(null)}
          disabled={disabled}
          language={language}
        />
      </div>

      {/* Block 2: tema */}
      <div className="border-t border-ink-100 pt-5">
        <Label htmlFor="topic">{t('Tema de la clase', 'Class topic')}</Label>
        <input
          type="text"
          id="topic"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder={t(
            'ej. Fracciones equivalentes · La fotosíntesis · Pretérito perfecto',
            'e.g., Equivalent fractions · Photosynthesis · Past simple tense'
          )}
          className={inputClass}
          required
          disabled={disabled}
        />
      </div>

      {/* Block 3: materia y grado */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="subjectArea">{t('Materia', 'Subject area')}</Label>
          <input
            type="text"
            id="subjectArea"
            value={subjectArea}
            onChange={(e) => setSubjectArea(e.target.value)}
            placeholder={t('Matemáticas, Ciencias, Lengua', 'Math, Science, Language Arts')}
            className={inputClass}
            required
            disabled={disabled}
          />
        </div>

        <div>
          <Label htmlFor="gradeLevel">{t('Grado / edad', 'Grade / age')}</Label>
          <input
            type="text"
            id="gradeLevel"
            value={gradeLevel}
            onChange={(e) => setGradeLevel(e.target.value)}
            placeholder={t('4° primaria (9-10 años)', '4th grade (9-10 years)')}
            className={inputClass}
            required
            disabled={disabled}
          />
        </div>
      </div>

      {/* Block 4: tono y duración */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="tone">{t('Tono', 'Tone')}</Label>
          <select
            id="tone"
            value={tone}
            onChange={(e) => setTone(e.target.value as LessonTone)}
            className={inputClass}
            disabled={disabled}
          >
            <option value="ludico">{t('🎲 Lúdico', '🎲 Playful')}</option>
            <option value="conversacional">{t('💬 Conversacional', '💬 Conversational')}</option>
            <option value="formal">{t('🎓 Formal', '🎓 Formal')}</option>
            <option value="inspirador">{t('✨ Inspirador', '✨ Inspiring')}</option>
          </select>
        </div>

        <div>
          <Label htmlFor="classDuration">{t('Duración', 'Duration')}</Label>
          <select
            id="classDuration"
            value={classDuration}
            onChange={(e) => setClassDuration(e.target.value as LessonDuration)}
            className={inputClass}
            disabled={disabled}
          >
            <option value="30">30 min</option>
            <option value="45">45 min</option>
            <option value="60">60 min</option>
            <option value="90">90 min</option>
          </select>
        </div>
      </div>

      {/* Block 5: opcionales */}
      <details className="group border-t border-ink-100 pt-4">
        <summary className="flex items-center gap-2 cursor-pointer list-none text-sm font-semibold text-ink-700 hover:text-brand-600 transition-colors">
          <Icon name="chevron" size={14} className="transition-transform group-open:rotate-90" />
          {t('Datos opcionales para personalizar más', 'Optional fields for more personalization')}
        </summary>
        <div className="space-y-4 pt-4 animate-fade-in">
          <div>
            <Label htmlFor="learningObjective" optional={t('(opcional)', '(optional)')}>
              {t('Objetivo de aprendizaje específico', 'Specific learning objective')}
            </Label>
            <textarea
              id="learningObjective"
              value={learningObjective}
              onChange={(e) => setLearningObjective(e.target.value)}
              placeholder={t(
                'ej. Que los alumnos puedan identificar fracciones equivalentes usando representaciones visuales',
                'e.g., Students will identify equivalent fractions using visual representations'
              )}
              className={`${inputClass} resize-none`}
              rows={2}
              disabled={disabled}
            />
          </div>

          <div>
            <Label htmlFor="learnerProfile" optional={t('(opcional)', '(optional)')}>
              {t('Perfil del alumno', 'Learner profile')}
            </Label>
            <textarea
              id="learnerProfile"
              value={learnerProfile}
              onChange={(e) => setLearnerProfile(e.target.value)}
              placeholder={t(
                'Necesidades, fortalezas o intereses del grupo',
                'Learning needs, strengths, or interests'
              )}
              className={`${inputClass} resize-none`}
              rows={2}
              disabled={disabled}
            />
          </div>

          <div>
            <Label htmlFor="constraints" optional={t('(opcional)', '(optional)')}>
              {t('Restricciones y materiales disponibles', 'Constraints and available materials')}
            </Label>
            <textarea
              id="constraints"
              value={constraints}
              onChange={(e) => setConstraints(e.target.value)}
              placeholder={t(
                'Materiales disponibles, tiempos, accesibilidad…',
                'Available materials, timing, accessibility…'
              )}
              className={`${inputClass} resize-none`}
              rows={2}
              disabled={disabled}
            />
          </div>
        </div>
      </details>

      {/* CTA */}
      <button
        type="submit"
        disabled={disabled}
        className="group relative w-full overflow-hidden bg-gradient-brand text-white py-3.5 px-6 rounded-xl font-semibold text-sm shadow-pop hover:shadow-glow hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-pop"
      >
        <span className="relative flex items-center justify-center gap-2">
          {disabled ? (
            <>
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              {t('Generando clase completa…', 'Generating full lesson…')}
            </>
          ) : (
            <>
              <Icon name="sparkle" size={16} />
              {t('Generar clase completa', 'Generate full lesson')}
              <Icon name="arrow-right" size={16} className="transition-transform group-hover:translate-x-0.5" />
            </>
          )}
        </span>
      </button>
    </form>
  );
}
