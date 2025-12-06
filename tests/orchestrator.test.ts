import { describe, it, expect, vi, beforeEach } from 'vitest';
import { buildWeeklyLessonProgram } from '@/lib/orchestrator';
import type {
  LessonPlanInput,
  LessonPlanWithValidation,
  ValidatedWeeklyProgram,
} from '@/lib/schemas';

const baseLessonValidation = {
  englishOnly: true,
  hasObjectives: true,
  hasMaterials: true,
  hasActivities: true,
  hasCriticalQuestions: true,
  montessoriComplete: true,
  constructivistComplete: true,
  criticalThinkingComplete: true,
  issues: [],
};

const makeLesson = (title: string): LessonPlanWithValidation => ({
  title,
  objectives: ['Objective 1', 'Objective 2'],
  materials: ['Material 1', 'Material 2'],
  activities: {
    prior_knowledge: 'Recall prior learning.',
    exploration: 'Explore with manipulatives.',
    concept_building: 'Connect findings to the big idea.',
    reflection: 'Reflect and self-correct with a peer.',
  },
  critical_questions: ['What evidence supports your idea?', 'How could this change in a new context?'],
  assessment: 'Observation notes and quick exit ticket.',
  pedagogy_flags: {
    montessori: { choice: true, hands_on: true, self_paced: true, self_correction: true },
    constructivist: { link_to_prior_knowledge: true, guided_discovery: true, social_interaction: true },
    critical: { open_questions: true, evidence_based_claims: true, peer_discussion: true },
  },
  validation: baseLessonValidation,
});

const validatedProgram: ValidatedWeeklyProgram = {
  weeklyTheme: 'Exploring Ecosystems',
  overview: 'Learners explore ecosystems through hands-on investigations and reflection.',
  template: { lesson: 'Objectives, materials, constructivist phases, critical questions, assessment, checklists' },
  lessons: [makeLesson('Lesson 1'), makeLesson('Lesson 2'), makeLesson('Lesson 3'), makeLesson('Lesson 4'), makeLesson('Lesson 5')],
  validation: {
    englishOnly: true,
    lessonsPassed: 5,
    totalLessons: 5,
    blockingIssues: [],
  },
};

vi.mock('@/lib/llm', () => ({
  generateWeeklyProgram: vi.fn(async () => validatedProgram),
  formatWeeklyMarkdown: vi.fn(async () => '# Weekly Plan\n\n- Objectives'),
}));

describe('buildWeeklyLessonProgram', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('assembles the weekly plan, attaches meta, and emits stage updates', async () => {
    const input: LessonPlanInput = {
      weeklyTheme: 'Exploring Ecosystems',
      subjectArea: 'Science',
      gradeLevel: 'Upper Elementary',
      learnerProfile: 'Curious experimenters',
      constraints: 'Recycled materials preferred',
    };

    const stages: Array<{ stage: string; status?: string }> = [];

    const program = await buildWeeklyLessonProgram(input, {
      onStage(stage, payload) {
        stages.push({ stage, status: (payload as { status?: string })?.status });
      },
    });

    expect(program.weeklyTheme).toBe(validatedProgram.weeklyTheme);
    expect(program.lessons).toHaveLength(5);
    expect(program.meta.subjectArea).toBe(input.subjectArea);
    expect(program.meta.gradeLevel).toBe(input.gradeLevel);
    expect(program.markdown).toContain('# Weekly Plan');
    expect(program.html).toContain('<h1');

    const stageOrder = stages.map((entry) => entry.stage);
    expect(stageOrder).toEqual(['outline', 'outline', 'validate', 'format', 'format']);
    expect(stages.find((event) => event.stage === 'validate')?.status).toBe('completed');
  });
});
