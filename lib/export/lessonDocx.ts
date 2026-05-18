import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
} from 'docx';
import type { SingleLessonResponse } from '@/lib/schemas';

type Lang = 'es' | 'en';

const LABELS: Record<Lang, Record<string, string>> = {
  es: {
    duration: 'Duración',
    minutes: 'min',
    grade: 'Grado',
    subject: 'Materia',
    overview: 'Vista general',
    learning_goal: 'Objetivo de aprendizaje',
    why: 'Por qué importa',
    prereq: 'Prerrequisitos',
    content: 'Contenido y vocabulario',
    explanation: 'Explicación principal',
    key_concepts: 'Conceptos clave',
    why_it_matters: 'Por qué importa',
    vocab: 'Vocabulario',
    in_context: 'En contexto',
    analogies: 'Analogías',
    illustrates: 'Ilustra',
    phases: 'Guión por fases',
    teacher_script: 'Guión del maestro',
    student_actions: 'Qué hacen los alumnos',
    materials: 'Materiales',
    transition: 'Transición',
    examples: 'Ejemplos resueltos',
    steps: 'Pasos',
    common_mistakes: 'Errores comunes',
    teacher_note: 'Nota para el maestro',
    misconceptions: 'Errores conceptuales',
    correction: 'Corrección',
    diagnostic: 'Pregunta diagnóstica',
    dialogue: 'Preguntas para el aula',
    responses: 'Respuestas esperadas',
    follow_up: 'Cómo seguir',
    worksheet: 'Hoja de trabajo',
    instructions: 'Consigna',
    answer: 'Respuesta',
    difficulty: 'Dificultad',
    difficulty_easy: 'Fácil',
    difficulty_medium: 'Media',
    difficulty_hard: 'Difícil',
    exit_ticket: 'Ticket de salida',
    rubric: 'Rúbrica',
    differentiation: 'Diferenciación',
    struggling: 'Para alumnos con dificultades',
    advanced: 'Para alumnos avanzados',
    accommodations: 'Adaptaciones',
    extension: 'Extensión',
    homework: 'Tarea',
    homework_time: 'Tiempo estimado',
    parent_note: 'Recado para padres',
    follow_up_lesson: 'Próxima clase',
    problem: 'Problema',
  },
  en: {
    duration: 'Duration',
    minutes: 'min',
    grade: 'Grade',
    subject: 'Subject',
    overview: 'Overview',
    learning_goal: 'Learning objective',
    why: 'Why it matters',
    prereq: 'Prerequisites',
    content: 'Content and vocabulary',
    explanation: 'Main explanation',
    key_concepts: 'Key concepts',
    why_it_matters: 'Why it matters',
    vocab: 'Vocabulary',
    in_context: 'In context',
    analogies: 'Analogies',
    illustrates: 'Illustrates',
    phases: 'Phase-by-phase script',
    teacher_script: 'Teacher script',
    student_actions: 'What students do',
    materials: 'Materials',
    transition: 'Transition',
    examples: 'Worked examples',
    steps: 'Steps',
    common_mistakes: 'Common mistakes',
    teacher_note: 'Teacher note',
    misconceptions: 'Common misconceptions',
    correction: 'Correction',
    diagnostic: 'Diagnostic question',
    dialogue: 'Classroom prompts',
    responses: 'Expected responses',
    follow_up: 'Follow-up',
    worksheet: 'Worksheet',
    instructions: 'Instructions',
    answer: 'Answer',
    difficulty: 'Difficulty',
    difficulty_easy: 'Easy',
    difficulty_medium: 'Medium',
    difficulty_hard: 'Hard',
    exit_ticket: 'Exit ticket',
    rubric: 'Rubric',
    differentiation: 'Differentiation',
    struggling: 'For struggling students',
    advanced: 'For advanced students',
    accommodations: 'Accommodations',
    extension: 'Extension',
    homework: 'Homework',
    homework_time: 'Estimated time',
    parent_note: 'Parent note',
    follow_up_lesson: 'Next lesson',
    problem: 'Problem',
  },
};

function h1(text: string): Paragraph {
  return new Paragraph({
    text,
    heading: HeadingLevel.HEADING_1,
    alignment: AlignmentType.CENTER,
    spacing: { before: 240, after: 240 },
  });
}

function h2(text: string): Paragraph {
  return new Paragraph({
    text,
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 360, after: 120 },
  });
}

function h3(text: string): Paragraph {
  return new Paragraph({
    text,
    heading: HeadingLevel.HEADING_3,
    spacing: { before: 240, after: 80 },
  });
}

function p(text: string): Paragraph {
  return new Paragraph({
    children: [new TextRun({ text })],
    spacing: { after: 120 },
  });
}

function pItalicCenter(text: string): Paragraph {
  return new Paragraph({
    children: [new TextRun({ text, italics: true })],
    alignment: AlignmentType.CENTER,
    spacing: { after: 240 },
  });
}

function labeled(label: string, text: string): Paragraph {
  return new Paragraph({
    children: [
      new TextRun({ text: `${label}: `, bold: true }),
      new TextRun({ text }),
    ],
    spacing: { after: 120 },
  });
}

function bullet(text: string): Paragraph {
  return new Paragraph({
    children: [new TextRun({ text })],
    bullet: { level: 0 },
    spacing: { after: 80 },
  });
}

function bulletLabeled(label: string, text: string): Paragraph {
  return new Paragraph({
    children: [
      new TextRun({ text: `${label}: `, bold: true }),
      new TextRun({ text }),
    ],
    bullet: { level: 0 },
    spacing: { after: 80 },
  });
}

function spacer(): Paragraph {
  return new Paragraph({ text: '' });
}

function difficultyLabel(d: 'easy' | 'medium' | 'hard', t: Record<string, string>): string {
  if (d === 'easy') return t.difficulty_easy;
  if (d === 'medium') return t.difficulty_medium;
  return t.difficulty_hard;
}

export async function buildLessonDocx(lesson: SingleLessonResponse): Promise<Buffer> {
  const lang: Lang = (lesson.meta.language as Lang) ?? 'es';
  const t = LABELS[lang];

  const blocks: Paragraph[] = [];

  // 1. Title + subtitle
  blocks.push(h1(lesson.title));
  if (lesson.subtitle) blocks.push(pItalicCenter(lesson.subtitle));

  // 2. Meta line
  blocks.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({ text: `${t.duration}: `, bold: true }),
        new TextRun({ text: `${lesson.meta.duration_min} ${t.minutes}` }),
        new TextRun({ text: '  ·  ' }),
        new TextRun({ text: `${t.grade}: `, bold: true }),
        new TextRun({ text: lesson.meta.grade_level }),
        new TextRun({ text: '  ·  ' }),
        new TextRun({ text: `${t.subject}: `, bold: true }),
        new TextRun({ text: lesson.meta.subject }),
      ],
      spacing: { after: 240 },
    })
  );

  // 3. Overview
  blocks.push(h2(t.overview));
  blocks.push(labeled(t.learning_goal, lesson.overview.learning_goal));
  blocks.push(labeled(t.why, lesson.overview.why_it_matters));
  if (lesson.overview.prerequisites.length > 0) {
    blocks.push(h3(t.prereq));
    lesson.overview.prerequisites.forEach((pr) => blocks.push(bullet(pr)));
  }

  // 4. Core content
  blocks.push(h2(t.content));
  blocks.push(h3(t.explanation));
  blocks.push(p(lesson.core_content.main_explanation));

  blocks.push(h3(t.key_concepts));
  lesson.core_content.key_concepts.forEach((c) => {
    blocks.push(bulletLabeled(c.name, c.definition));
    if (c.why_it_matters) {
      blocks.push(
        new Paragraph({
          children: [
            new TextRun({ text: `   ${t.why_it_matters}: `, italics: true, bold: true }),
            new TextRun({ text: c.why_it_matters, italics: true }),
          ],
          spacing: { after: 80 },
        })
      );
    }
  });

  blocks.push(h3(t.vocab));
  lesson.core_content.vocabulary.forEach((v) => {
    blocks.push(bulletLabeled(v.term, v.definition));
    if (v.example_in_context) {
      blocks.push(
        new Paragraph({
          children: [
            new TextRun({ text: `   ${t.in_context}: `, italics: true, bold: true }),
            new TextRun({ text: v.example_in_context, italics: true }),
          ],
          spacing: { after: 80 },
        })
      );
    }
  });

  blocks.push(h3(t.analogies));
  lesson.core_content.analogies.forEach((a) => {
    blocks.push(bullet(a.analogy));
    if (a.what_it_illustrates) {
      blocks.push(
        new Paragraph({
          children: [
            new TextRun({ text: `   ${t.illustrates}: `, italics: true, bold: true }),
            new TextRun({ text: a.what_it_illustrates, italics: true }),
          ],
          spacing: { after: 80 },
        })
      );
    }
  });

  // 5. Phases
  blocks.push(h2(t.phases));
  lesson.phases.forEach((phase, i) => {
    blocks.push(h3(`${i + 1}. ${phase.name} (${phase.duration_min} ${t.minutes})`));
    if (phase.teacher_script) {
      blocks.push(labeled(t.teacher_script, phase.teacher_script));
    }
    if (phase.student_actions) {
      blocks.push(labeled(t.student_actions, phase.student_actions));
    }
    if (phase.materials_used?.length) {
      blocks.push(labeled(t.materials, phase.materials_used.join(', ')));
    }
    if (phase.transitions) {
      blocks.push(labeled(t.transition, phase.transitions));
    }
  });

  // 6. Worked examples
  blocks.push(h2(t.examples));
  lesson.worked_examples.forEach((ex, i) => {
    blocks.push(h3(`${i + 1}. ${ex.example}`));
    if (ex.solution_steps?.length) {
      blocks.push(
        new Paragraph({
          children: [new TextRun({ text: `${t.steps}:`, bold: true })],
          spacing: { after: 60 },
        })
      );
      ex.solution_steps.forEach((s, idx) => blocks.push(bullet(`${idx + 1}. ${s}`)));
    }
    if (ex.common_mistakes?.length) {
      blocks.push(
        new Paragraph({
          children: [new TextRun({ text: `${t.common_mistakes}:`, bold: true })],
          spacing: { after: 60 },
        })
      );
      ex.common_mistakes.forEach((m) => blocks.push(bullet(m)));
    }
    if (ex.teacher_note) blocks.push(labeled(t.teacher_note, ex.teacher_note));
  });

  // 7. Common misconceptions
  blocks.push(h2(t.misconceptions));
  lesson.common_misconceptions.forEach((m) => {
    blocks.push(bulletLabeled(m.misconception, m.correction));
    if (m.diagnostic_question) {
      blocks.push(
        new Paragraph({
          children: [
            new TextRun({ text: `   ${t.diagnostic}: `, italics: true, bold: true }),
            new TextRun({ text: m.diagnostic_question, italics: true }),
          ],
          spacing: { after: 80 },
        })
      );
    }
  });

  // 8. Dialogue prompts
  blocks.push(h2(t.dialogue));
  lesson.dialogue_prompts.forEach((dp, i) => {
    blocks.push(h3(`${i + 1}. ${dp.question}`));
    if (dp.expected_responses?.length) {
      blocks.push(
        new Paragraph({
          children: [new TextRun({ text: `${t.responses}:`, bold: true })],
          spacing: { after: 60 },
        })
      );
      dp.expected_responses.forEach((r) => blocks.push(bullet(r)));
    }
    if (dp.teacher_follow_up) blocks.push(labeled(t.follow_up, dp.teacher_follow_up));
  });

  // 9. Worksheet
  blocks.push(h2(t.worksheet));
  blocks.push(labeled(t.instructions, lesson.worksheet.instructions));
  lesson.worksheet.problems.forEach((prob) => {
    blocks.push(h3(`${t.problem} ${prob.number}`));
    blocks.push(p(prob.prompt));
    blocks.push(labeled(t.answer, prob.answer));
    blocks.push(labeled(t.difficulty, difficultyLabel(prob.difficulty, t)));
  });

  // 10. Exit ticket
  blocks.push(h2(t.exit_ticket));
  lesson.exit_ticket.questions.forEach((q, i) => {
    blocks.push(h3(`${i + 1}. ${q.prompt}`));
    blocks.push(labeled(t.answer, q.answer));
  });
  if (lesson.exit_ticket.grading_rubric) {
    blocks.push(labeled(t.rubric, lesson.exit_ticket.grading_rubric));
  }

  // 11. Differentiation
  blocks.push(h2(t.differentiation));
  blocks.push(labeled(t.struggling, lesson.differentiation.for_struggling));
  blocks.push(labeled(t.advanced, lesson.differentiation.for_advanced));
  blocks.push(labeled(t.accommodations, lesson.differentiation.accommodations));

  // 12. Extension
  blocks.push(h2(t.extension));
  if (lesson.extension.homework) {
    blocks.push(h3(t.homework));
    blocks.push(p(lesson.extension.homework.description));
    if (lesson.extension.homework.expected_time_min) {
      blocks.push(
        labeled(
          t.homework_time,
          `${lesson.extension.homework.expected_time_min} ${t.minutes}`
        )
      );
    }
  }
  if (lesson.extension.parent_note) {
    blocks.push(labeled(t.parent_note, lesson.extension.parent_note));
  }
  blocks.push(labeled(t.follow_up_lesson, lesson.extension.follow_up_lesson_idea));

  blocks.push(spacer());

  const doc = new Document({
    creator: 'Aula',
    title: lesson.title,
    description: lesson.subtitle || '',
    styles: {
      default: {
        document: {
          run: {
            font: 'Calibri',
            size: 22, // 11pt
          },
        },
      },
    },
    sections: [
      {
        properties: {
          page: {
            margin: { top: 1134, right: 1134, bottom: 1134, left: 1134 }, // ~2cm in twips
          },
        },
        children: blocks,
      },
    ],
  });

  return await Packer.toBuffer(doc);
}
