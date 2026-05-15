import {
  formatWeeklyMarkdown,
  generateClassMaterialsPackage,
  generateSingleLesson,
  generateWeeklyProgram,
} from './llm';
import { markdownToHtml } from './markdown';
import type {
  ClassPackageResponse,
  ClassPlanRequest,
  LessonPlanInput,
  LessonProgramResponse,
  SingleLessonInput,
  SingleLessonResponse,
  ValidatedClassPackage,
  ValidatedSingleLesson,
} from './schemas';

export type GenerationStage = 'outline' | 'validate' | 'format' | null;

export async function buildWeeklyLessonProgram(
  input: LessonPlanInput,
  options?: {
    onStage?: (stage: GenerationStage, payload?: Record<string, unknown>) => void;
  }
): Promise<LessonProgramResponse> {
  const onStage = options?.onStage;

  onStage?.('outline', { status: 'started' });
  const structured = await generateWeeklyProgram(input);
  onStage?.('outline', { status: 'completed', lessons: structured.lessons.length });

  onStage?.('validate', {
    status: structured.validation.blockingIssues.length ? 'failed' : 'completed',
    issues: structured.validation.blockingIssues,
  });

  if (structured.validation.blockingIssues.length) {
    throw new Error(structured.validation.blockingIssues.join(' | '));
  }

  onStage?.('format', { status: 'started' });
  const markdown = await formatWeeklyMarkdown(structured);
  const html = markdownToHtml(markdown);
  onStage?.('format', { status: 'completed' });

  return {
    ...structured,
    markdown,
    html,
    meta: {
      subjectArea: input.subjectArea,
      gradeLevel: input.gradeLevel,
      learnerProfile: input.learnerProfile,
      constraints: input.constraints,
      language: input.language,
      tone: input.tone,
      userType: input.userType,
      classDuration: input.classDuration,
      generatedAt: new Date().toISOString(),
    },
  };
}

function formatClassPackageMarkdown(pkg: ValidatedClassPackage): string {
  const lines: string[] = [];

  lines.push(`# ${pkg.classTitle}`);
  lines.push(`Level: ${pkg.level} | Bloom level: ${pkg.bloomLevel}`);
  lines.push('');
  lines.push('## Overall objectives');
  pkg.overallObjectives.forEach((objective) => lines.push(`- ${objective}`));
  lines.push('');
  lines.push('## Consolidated view');
  lines.push(`**Overview:** ${pkg.consolidated.overview}`);
  lines.push(`**Publishing notes:** ${pkg.consolidated.publishingNotes}`);
  lines.push(`**Learner journey:** ${pkg.consolidated.learnerJourney}`);
  lines.push(`**QA checklist:** ${pkg.consolidated.qaChecklist}`);
  lines.push('');

  pkg.topics.forEach((topic, index) => {
    lines.push(`## Topic ${index + 1}: ${topic.topic}`);
    lines.push(`Template fit: ${topic.levelTemplate}`);
    lines.push(`Bloom target: ${topic.bloomTarget}`);
    lines.push('');
    lines.push('### Introduction');
    lines.push(topic.sections.introduction);
    lines.push('');
    lines.push('### Theory');
    lines.push(topic.sections.theory);
    lines.push('');
    lines.push('### Examples');
    topic.sections.examples.forEach((example) => lines.push(`- ${example}`));
    lines.push('');
    lines.push('### Exercises with solutions');
    topic.sections.exercises_with_solutions.forEach((exercise, idx) => {
      lines.push(`${idx + 1}. ${exercise.prompt} (Bloom: ${exercise.bloom_focus})`);
      lines.push(`   - Solution: ${exercise.solution}`);
    });
    lines.push('');
    lines.push('### Self-assessment');
    topic.sections.self_assessment.forEach((item) => lines.push(`- ${item}`));
    lines.push('');
    lines.push('### Resources');
    topic.sections.resources.forEach((resource) => lines.push(`- ${resource}`));
    lines.push('');
    lines.push('### Coverage and QA');
    lines.push(`- Objectives addressed: ${topic.coverage.objectivesAddressed.join('; ')}`);
    lines.push(`- Bloom alignment: ${topic.coverage.bloomAlignment}`);
    lines.push(`- Length check: ${topic.coverage.minimumLengthRationale}`);
    lines.push(
      `- Validation: ${topic.validation.issues.length === 0 ? 'All checks passed' : topic.validation.issues.join(' | ')}`
    );
    lines.push('');
    lines.push('### Sub-agent notes');
    lines.push(`- Conceptual: ${topic.subagentNotes.conceptual}`);
    lines.push(`- Examples: ${topic.subagentNotes.examples}`);
    lines.push(`- Exercises: ${topic.subagentNotes.exercises}`);
    lines.push(`- Resources: ${topic.subagentNotes.resources}`);
    lines.push(`- Pedagogical review: ${topic.subagentNotes.review}`);
    lines.push('');
  });

  return lines.join('\n');
}

export async function buildClassPackage(
  input: ClassPlanRequest,
  options?: { onStage?: (stage: GenerationStage, payload?: Record<string, unknown>) => void }
): Promise<ClassPackageResponse> {
  const onStage = options?.onStage;

  onStage?.('outline', { status: 'started' });
  const structured = await generateClassMaterialsPackage(input);
  onStage?.('outline', { status: 'completed', topics: structured.topics.length });

  onStage?.('validate', {
    status: structured.validation.blockingIssues.length ? 'failed' : 'completed',
    issues: structured.validation.blockingIssues,
  });

  if (structured.validation.blockingIssues.length) {
    throw new Error(structured.validation.blockingIssues.join(' | '));
  }

  onStage?.('format', { status: 'started' });
  const markdown = formatClassPackageMarkdown(structured);
  const html = markdownToHtml(markdown);
  onStage?.('format', { status: 'completed' });

  return {
    ...structured,
    markdown,
    html,
    meta: {
      level: input.level,
      bloomLevel: input.bloomLevel,
      constraints: input.constraints,
      generatedAt: new Date().toISOString(),
    },
  };
}

// ============================================================================
// Phase 2 — Single deep lesson orchestrator
// ============================================================================

const DIFFICULTY_LABELS: Record<'easy' | 'medium' | 'hard', { es: string; en: string }> = {
  easy: { es: 'fácil', en: 'easy' },
  medium: { es: 'medio', en: 'medium' },
  hard: { es: 'difícil', en: 'hard' },
};

const SECTION_HEADINGS = {
  es: {
    overview: 'Vista general',
    learning_goal: 'Objetivo de aprendizaje',
    why_it_matters: 'Por qué importa',
    prerequisites: 'Prerrequisitos',
    core_content: 'Contenido principal',
    main_explanation: 'Explicación',
    key_concepts: 'Conceptos clave',
    vocabulary: 'Vocabulario',
    analogies: 'Analogías',
    phases: 'Guión por fases',
    teacher_script: 'Guión del maestro',
    student_actions: 'Qué hacen los alumnos',
    materials: 'Materiales',
    transition: 'Transición',
    worked_examples: 'Ejemplos resueltos',
    steps: 'Pasos',
    common_mistakes: 'Errores comunes',
    teacher_note: 'Nota para el maestro',
    misconceptions: 'Errores conceptuales comunes',
    correction: 'Corrección',
    diagnostic: 'Pregunta diagnóstica',
    dialogue: 'Preguntas para el aula',
    expected_responses: 'Respuestas esperadas',
    follow_up: 'Cómo seguir',
    worksheet: 'Hoja de trabajo',
    instructions: 'Consigna',
    problems: 'Problemas',
    answer: 'Respuesta',
    difficulty: 'Dificultad',
    exit_ticket: 'Ticket de salida',
    rubric: 'Rúbrica',
    differentiation: 'Diferenciación',
    struggling: 'Para alumnos con dificultades',
    advanced: 'Para alumnos avanzados',
    accommodations: 'Adaptaciones',
    extension: 'Extensión',
    homework: 'Tarea',
    parent_note: 'Nota para padres',
    follow_up_lesson: 'Idea para la próxima clase',
    pedagogy: 'Validación pedagógica',
    minutes: 'min',
  },
  en: {
    overview: 'Overview',
    learning_goal: 'Learning goal',
    why_it_matters: 'Why it matters',
    prerequisites: 'Prerequisites',
    core_content: 'Core content',
    main_explanation: 'Explanation',
    key_concepts: 'Key concepts',
    vocabulary: 'Vocabulary',
    analogies: 'Analogies',
    phases: 'Phase-by-phase teacher script',
    teacher_script: 'Teacher script',
    student_actions: 'Student actions',
    materials: 'Materials',
    transition: 'Transition',
    worked_examples: 'Worked examples',
    steps: 'Steps',
    common_mistakes: 'Common mistakes',
    teacher_note: 'Teacher note',
    misconceptions: 'Common misconceptions',
    correction: 'Correction',
    diagnostic: 'Diagnostic question',
    dialogue: 'Classroom dialogue prompts',
    expected_responses: 'Expected responses',
    follow_up: 'Teacher follow-up',
    worksheet: 'Worksheet',
    instructions: 'Instructions',
    problems: 'Problems',
    answer: 'Answer',
    difficulty: 'Difficulty',
    exit_ticket: 'Exit ticket',
    rubric: 'Rubric',
    differentiation: 'Differentiation',
    struggling: 'For struggling learners',
    advanced: 'For advanced learners',
    accommodations: 'Accommodations',
    extension: 'Extension',
    homework: 'Homework',
    parent_note: 'Parent note',
    follow_up_lesson: 'Idea for the next class',
    pedagogy: 'Pedagogy validation',
    minutes: 'min',
  },
} as const;

function formatSingleLessonMarkdown(lesson: ValidatedSingleLesson, language: 'es' | 'en'): string {
  const h = SECTION_HEADINGS[language];
  const lines: string[] = [];

  lines.push(`# ${lesson.title}`);
  if (lesson.subtitle) lines.push(`_${lesson.subtitle}_`);
  lines.push('');
  lines.push(`**${h.minutes}**: ${lesson.meta.duration_min} · **${lesson.meta.grade_level}** · ${lesson.meta.subject}`);
  lines.push('');

  // Overview
  lines.push(`## ${h.overview}`);
  lines.push(`**${h.learning_goal}**: ${lesson.overview.learning_goal}`);
  lines.push('');
  lines.push(`**${h.why_it_matters}**: ${lesson.overview.why_it_matters}`);
  if (lesson.overview.prerequisites.length) {
    lines.push('');
    lines.push(`**${h.prerequisites}**:`);
    lesson.overview.prerequisites.forEach((p) => lines.push(`- ${p}`));
  }
  lines.push('');

  // Core content
  lines.push(`## ${h.core_content}`);
  lines.push(`### ${h.main_explanation}`);
  lines.push(lesson.core_content.main_explanation);
  lines.push('');
  lines.push(`### ${h.key_concepts}`);
  lesson.core_content.key_concepts.forEach((concept) => {
    lines.push(`- **${concept.name}** — ${concept.definition} _(${concept.why_it_matters})_`);
  });
  lines.push('');
  lines.push(`### ${h.vocabulary}`);
  lesson.core_content.vocabulary.forEach((v) => {
    lines.push(`- **${v.term}**: ${v.definition}`);
    lines.push(`  - _${v.example_in_context}_`);
  });
  lines.push('');
  lines.push(`### ${h.analogies}`);
  lesson.core_content.analogies.forEach((a) => {
    lines.push(`- ${a.analogy} → ${a.what_it_illustrates}`);
  });
  lines.push('');

  // Phases
  lines.push(`## ${h.phases}`);
  lesson.phases.forEach((phase, idx) => {
    lines.push(`### ${idx + 1}. ${phase.name} _(${phase.duration_min} ${h.minutes})_`);
    lines.push(`**${h.teacher_script}:**`);
    lines.push('');
    lines.push(phase.teacher_script);
    lines.push('');
    lines.push(`**${h.student_actions}**: ${phase.student_actions}`);
    if (phase.materials_used.length) {
      lines.push(`**${h.materials}**: ${phase.materials_used.join(', ')}`);
    }
    lines.push(`**${h.transition}**: ${phase.transitions}`);
    lines.push('');
  });

  // Worked examples
  lines.push(`## ${h.worked_examples}`);
  lesson.worked_examples.forEach((ex, idx) => {
    lines.push(`### ${idx + 1}. ${ex.example}`);
    lines.push(`**${h.steps}:**`);
    ex.solution_steps.forEach((step, sIdx) => lines.push(`${sIdx + 1}. ${step}`));
    if (ex.common_mistakes.length) {
      lines.push('');
      lines.push(`**${h.common_mistakes}**:`);
      ex.common_mistakes.forEach((m) => lines.push(`- ${m}`));
    }
    lines.push('');
    lines.push(`> **${h.teacher_note}**: ${ex.teacher_note}`);
    lines.push('');
  });

  // Misconceptions
  lines.push(`## ${h.misconceptions}`);
  lesson.common_misconceptions.forEach((m) => {
    lines.push(`- **${m.misconception}**`);
    lines.push(`  - ${h.correction}: ${m.correction}`);
    lines.push(`  - ${h.diagnostic}: _${m.diagnostic_question}_`);
  });
  lines.push('');

  // Dialogue
  lines.push(`## ${h.dialogue}`);
  lesson.dialogue_prompts.forEach((d, idx) => {
    lines.push(`### ${idx + 1}. ${d.question}`);
    lines.push(`**${h.expected_responses}**:`);
    d.expected_responses.forEach((r) => lines.push(`- ${r}`));
    lines.push(`**${h.follow_up}**: ${d.teacher_follow_up}`);
    lines.push('');
  });

  // Worksheet
  lines.push(`## ${h.worksheet}`);
  lines.push(`**${h.instructions}**: ${lesson.worksheet.instructions}`);
  lines.push('');
  lines.push(`### ${h.problems}`);
  lesson.worksheet.problems.forEach((p) => {
    lines.push(`${p.number}. ${p.prompt} _(${h.difficulty}: ${DIFFICULTY_LABELS[p.difficulty][language]})_`);
    lines.push(`   - **${h.answer}**: ${p.answer}`);
  });
  lines.push('');

  // Exit ticket
  lines.push(`## ${h.exit_ticket}`);
  lesson.exit_ticket.questions.forEach((q, idx) => {
    lines.push(`${idx + 1}. ${q.prompt}`);
    lines.push(`   - **${h.answer}**: ${q.answer}`);
  });
  lines.push('');
  lines.push(`**${h.rubric}**: ${lesson.exit_ticket.grading_rubric}`);
  lines.push('');

  // Differentiation
  lines.push(`## ${h.differentiation}`);
  lines.push(`- **${h.struggling}**: ${lesson.differentiation.for_struggling}`);
  lines.push(`- **${h.advanced}**: ${lesson.differentiation.for_advanced}`);
  lines.push(`- **${h.accommodations}**: ${lesson.differentiation.accommodations}`);
  lines.push('');

  // Extension
  lines.push(`## ${h.extension}`);
  if (lesson.extension.homework) {
    lines.push(
      `**${h.homework}** _(${lesson.extension.homework.expected_time_min} ${h.minutes})_: ${lesson.extension.homework.description}`
    );
    lines.push('');
  }
  if (lesson.extension.parent_note) {
    lines.push(`**${h.parent_note}**:`);
    lines.push('');
    lines.push(`> ${lesson.extension.parent_note.replace(/\n/g, '\n> ')}`);
    lines.push('');
  }
  lines.push(`**${h.follow_up_lesson}**: ${lesson.extension.follow_up_lesson_idea}`);
  lines.push('');

  return lines.join('\n');
}

export async function buildSingleLesson(
  input: SingleLessonInput,
  options?: {
    onStage?: (stage: GenerationStage, payload?: Record<string, unknown>) => void;
  }
): Promise<SingleLessonResponse> {
  const onStage = options?.onStage;

  onStage?.('outline', { status: 'started' });
  const structured = await generateSingleLesson(input);
  onStage?.('outline', { status: 'completed', phases: structured.phases.length });

  onStage?.('validate', {
    status: structured.validation.issues.length ? 'failed' : 'completed',
    issues: structured.validation.issues,
  });

  if (structured.validation.issues.length) {
    throw new Error(structured.validation.issues.join(' | '));
  }

  onStage?.('format', { status: 'started' });
  const markdown = formatSingleLessonMarkdown(structured, input.language);
  const html = markdownToHtml(markdown);
  onStage?.('format', { status: 'completed' });

  return {
    ...structured,
    markdown,
    html,
    meta: {
      duration_min: structured.meta.duration_min,
      grade_level: structured.meta.grade_level,
      subject: structured.meta.subject,
      topic: input.topic,
      subjectArea: input.subjectArea,
      gradeLevel: input.gradeLevel,
      learningObjective: input.learningObjective,
      learnerProfile: input.learnerProfile,
      constraints: input.constraints,
      sourceFilename: input.sourceFilename,
      sourceWordCount: input.sourceMaterial
        ? input.sourceMaterial.split(/\s+/).filter(Boolean).length
        : undefined,
      language: input.language,
      tone: input.tone,
      userType: input.userType,
      classDuration: input.classDuration,
      generatedAt: new Date().toISOString(),
    },
  };
}
