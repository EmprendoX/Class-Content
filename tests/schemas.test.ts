import { describe, it, expect } from 'vitest';
import {
  LessonPlanInputSchema,
  LessonPlanSchema,
  WeeklyProgramSchema,
  validateLesson,
  validateWeeklyProgram,
} from '@/lib/schemas';

const basePedagogyFlags = {
  montessori: { choice: true, hands_on: true, self_paced: true, self_correction: true },
  constructivist: { link_to_prior_knowledge: true, guided_discovery: true, social_interaction: true },
  critical: { open_questions: true, evidence_based_claims: true, peer_discussion: true },
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
  critical_questions: ['How does evidence change your claim?', 'What patterns do you observe?'],
  assessment: 'Observation notes plus a quick exit ticket.',
  pedagogy_flags: basePedagogyFlags,
});

describe('LessonPlanInputSchema', () => {
  it('trims optional values and enforces English content', () => {
    const result = LessonPlanInputSchema.parse({
      weeklyTheme: '  Exploring Ecosystems ',
      subjectArea: ' Science ',
      gradeLevel: ' Upper Elementary ',
      learnerProfile: '  Curious learners who enjoy hands-on labs  ',
      constraints: '  Low-cost materials only  ',
    });

    expect(result.weeklyTheme).toBe('Exploring Ecosystems');
    expect(result.constraints).toBe('Low-cost materials only');
  });

  it('rejects non-English characters', () => {
    expect(() =>
      LessonPlanInputSchema.parse({
        weeklyTheme: 'Energía y materia',
        subjectArea: 'Science',
        gradeLevel: 'Upper',
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

  it('validates weekly program length and English-only output', () => {
    const weeklyProgram = WeeklyProgramSchema.parse({
      weeklyTheme: 'Forces and Motion',
      overview: 'Learners explore motion with hands-on investigations.',
      template: { lesson: 'Objectives, materials, activities, questions, assessment, checklists' },
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
      template: { lesson: 'Reusable lesson template' },
      lessons: [makeLesson('L1'), makeLesson('L2'), makeLesson('L3'), makeLesson('L4'), makeLesson('L5')],
    });

    expect(weeklyProgram.validation.lessonsPassed).toBe(5);
    expect(weeklyProgram.validation.blockingIssues).toHaveLength(0);
  });
});
