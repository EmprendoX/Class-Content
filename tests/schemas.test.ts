import { describe, it, expect } from 'vitest';
import {
  LessonPlanInputSchema,
  LessonPlanSchema,
  WeeklyProgramSchema,
  validateLesson,
  validateWeeklyProgram,
} from '@/lib/schemas';

const basePedagogyFlags = {
  montessori: { choice: true, hands_on: true, prepared_environment: true, self_correction: true },
  constructivist: { link_to_prior_knowledge: true, guided_discovery: true, social_interaction: true, peer_collaboration: true },
  critical: { open_questions: true, evidence_based_claims: true, peer_discussion: true },
};

const baseMontessoriElements = {
  prepared_environment: 'Shelf stations with labeled trays',
  manipulatives: 'Hands-on kit with varied textures and scales',
  choice: 'Learners pick two of three stations',
  self_correction: 'Self-check cards at each station',
};

const makeLesson = (title: string) => ({
  title,
  objectives: ['Identify patterns', 'Build evidence-based claims'],
  materials: ['Journal', 'Science kit'],
  activities: {
    prior_knowledge: 'Students recall prior experiments with plants.',
    exploration: 'Small groups build terrariums with learner choice of materials.',
    concept_building: 'Facilitator guides learners to connect observations to ecosystems.',
    reflection: 'Learners self-correct using a checklist and share takeaways.',
  },
  montessori: baseMontessoriElements,
  critical_questions: [
    'How does evidence change your claim?',
    'What patterns do you observe?',
    'Where do you see room for self-correction?',
  ],
  assessment: 'Observation notes plus a quick exit ticket.',
  duration: '55 minutes',
  age_range: 'Ages 9-11',
  pedagogy_flags: basePedagogyFlags,
});

describe('LessonPlanInputSchema', () => {
  it('trims optional values and applies sensible defaults', () => {
    const result = LessonPlanInputSchema.parse({
      weeklyTheme: '  Exploring Ecosystems ',
      subjectArea: ' Science ',
      gradeLevel: ' Upper Elementary ',
      learnerProfile: '  Curious learners who enjoy hands-on labs  ',
      constraints: '  Low-cost materials only  ',
    });

    expect(result.weeklyTheme).toBe('Exploring Ecosystems');
    expect(result.constraints).toBe('Low-cost materials only');
    expect(result.language).toBe('es');
    expect(result.tone).toBe('conversacional');
    expect(result.userType).toBe('maestro');
    expect(result.classDuration).toBe('45');
  });

  it('accepts Spanish characters (acentos and ñ)', () => {
    const result = LessonPlanInputSchema.parse({
      weeklyTheme: 'Energía y materia',
      subjectArea: 'Matemáticas',
      gradeLevel: 'Primaria — niños de 9 a 11 años',
    });

    expect(result.weeklyTheme).toBe('Energía y materia');
    expect(result.subjectArea).toBe('Matemáticas');
    expect(result.gradeLevel).toBe('Primaria — niños de 9 a 11 años');
  });

  it('honors explicit language/tone/userType/classDuration choices', () => {
    const result = LessonPlanInputSchema.parse({
      weeklyTheme: 'Fractions',
      subjectArea: 'Math',
      gradeLevel: 'Grade 4',
      language: 'en',
      tone: 'inspirador',
      userType: 'padre',
      classDuration: '90',
    });

    expect(result.language).toBe('en');
    expect(result.tone).toBe('inspirador');
    expect(result.userType).toBe('padre');
    expect(result.classDuration).toBe('90');
  });

  it('rejects unknown enum values', () => {
    expect(() =>
      LessonPlanInputSchema.parse({
        weeklyTheme: 'Test',
        subjectArea: 'Test',
        gradeLevel: 'Test',
        language: 'fr',
      })
    ).toThrow();
  });
});

describe('Lesson and weekly schemas', () => {
  it('requires Montessori/constructivist/critical-thinking flags to be true', () => {
    expect(() =>
      LessonPlanSchema.parse({
        ...makeLesson('Lesson 1'),
        pedagogy_flags: {
          ...basePedagogyFlags,
          montessori: { ...basePedagogyFlags.montessori, hands_on: false },
        },
      })
    ).toThrow();
  });

  it('validates weekly program length', () => {
    const weeklyProgram = WeeklyProgramSchema.parse({
      weeklyTheme: 'Forces and Motion',
      overview: 'Learners explore motion with hands-on investigations.',
      template: {
        lesson: 'Objectives, materials, activities, questions, assessment, checklists',
        lesson_schema: makeLesson('Template lesson'),
        weekly_template: ['Class 1 focus', 'Class 2 exploration', 'Class 3 build', 'Class 4 refine', 'Class 5 share'],
        reference_week: {
          theme: 'Exploring Ecosystems',
          lessons: [0, 1, 2, 3, 4].map((idx) => makeLesson(`Reference ${idx + 1}`)),
        },
      },
      lessons: [0, 1, 2, 3, 4].map((idx) => makeLesson(`Lesson ${idx + 1}`)),
    });

    expect(weeklyProgram.lessons).toHaveLength(5);
    expect(weeklyProgram.weeklyTheme).toBe('Forces and Motion');
  });
});

describe('Validation helpers', () => {
  it('flags missing checklists or required sections', () => {
    const lesson = {
      ...makeLesson('Lesson with gaps'),
      materials: [],
      pedagogy_flags: {
        ...basePedagogyFlags,
        critical: { open_questions: true, evidence_based_claims: false, peer_discussion: true },
      },
    };

    const validation = validateLesson(lesson);
    expect(validation.hasMaterials).toBe(false);
    expect(validation.criticalThinkingComplete).toBe(false);
    expect(validation.issues.length).toBeGreaterThanOrEqual(2);
  });

  it('summarizes weekly validation state', () => {
    const weeklyProgram = validateWeeklyProgram({
      weeklyTheme: 'Light and Shadow',
      overview: 'Investigate how light travels and how shadows form.',
      template: {
        lesson: 'Reusable lesson template',
        lesson_schema: makeLesson('Schema Example'),
        weekly_template: ['Day 1', 'Day 2', 'Day 3', 'Day 4', 'Day 5'],
        reference_week: {
          theme: 'Exploring Ecosystems',
          lessons: [makeLesson('R1'), makeLesson('R2'), makeLesson('R3'), makeLesson('R4'), makeLesson('R5')],
        },
      },
      lessons: [makeLesson('L1'), makeLesson('L2'), makeLesson('L3'), makeLesson('L4'), makeLesson('L5')],
    });

    expect(weeklyProgram.validation.lessonsPassed).toBe(5);
    expect(weeklyProgram.validation.blockingIssues).toHaveLength(0);
  });
});
