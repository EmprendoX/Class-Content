import { z } from 'zod';

const isEnglish = (value: string) => !/[áéíóúÁÉÍÓÚñÑ¿¡]/.test(value);

const trimValue = <T>(schema: z.ZodType<T>) =>
  z.preprocess((val) => (typeof val === 'string' ? val.trim() : val), schema);

const requiredEnglishString = trimValue(z.string().min(1)).refine(isEnglish, {
  message: 'Content must be in English and avoid accented characters.',
});

const optionalEnglishString = z
  .preprocess(
    (val) => {
      if (val === undefined || val === null) return undefined;
      if (typeof val === 'string') {
        const trimmed = val.trim();
        return trimmed.length ? trimmed : undefined;
      }
      return val;
    },
    z.string().optional()
  )
  .refine((val) => val === undefined || isEnglish(val), {
    message: 'Optional content must be in English.',
  });

export const LessonPlanInputSchema = z.object({
  weeklyTheme: requiredEnglishString,
  subjectArea: requiredEnglishString,
  gradeLevel: requiredEnglishString,
  learnerProfile: optionalEnglishString,
  constraints: optionalEnglishString,
});

export type LessonPlanInput = z.infer<typeof LessonPlanInputSchema>;

const LessonActivitiesSchema = z.object({
  prior_knowledge: requiredEnglishString,
  exploration: requiredEnglishString,
  concept_building: requiredEnglishString,
  reflection: requiredEnglishString,
});

const PedagogyFlagsSchema = z.object({
  montessori: z.object({
    choice: z.boolean(),
    hands_on: z.boolean(),
    self_paced: z.boolean(),
    self_correction: z.boolean(),
  }),
  constructivist: z.object({
    link_to_prior_knowledge: z.boolean(),
    guided_discovery: z.boolean(),
    social_interaction: z.boolean(),
  }),
  critical: z.object({
    open_questions: z.boolean(),
    evidence_based_claims: z.boolean(),
    peer_discussion: z.boolean(),
  }),
});

export const LessonPlanSchema = z
  .object({
    title: requiredEnglishString,
    objectives: z.array(requiredEnglishString).min(1),
    materials: z.array(requiredEnglishString).min(1),
    activities: LessonActivitiesSchema,
    critical_questions: z.array(requiredEnglishString).min(1),
    assessment: requiredEnglishString,
    pedagogy_flags: PedagogyFlagsSchema,
  })
  .refine((lesson) => lesson.pedagogy_flags.montessori.choice, {
    message: 'Montessori choice flag must be true.',
    path: ['pedagogy_flags', 'montessori', 'choice'],
  })
  .refine((lesson) => lesson.pedagogy_flags.montessori.hands_on, {
    message: 'Montessori hands_on flag must be true.',
    path: ['pedagogy_flags', 'montessori', 'hands_on'],
  })
  .refine((lesson) => lesson.pedagogy_flags.constructivist.link_to_prior_knowledge, {
    message: 'Constructivist prior knowledge flag must be true.',
    path: ['pedagogy_flags', 'constructivist', 'link_to_prior_knowledge'],
  })
  .refine((lesson) => lesson.pedagogy_flags.critical.open_questions, {
    message: 'Critical thinking open questions flag must be true.',
    path: ['pedagogy_flags', 'critical', 'open_questions'],
  });

export type LessonPlan = z.infer<typeof LessonPlanSchema>;

export const WeeklyProgramSchema = z.object({
  weeklyTheme: requiredEnglishString,
  overview: requiredEnglishString,
  template: z.object({
    lesson: requiredEnglishString,
  }),
  lessons: z.array(LessonPlanSchema).length(5, {
    message: 'Weekly program must include exactly 5 lessons.',
  }),
});

export type WeeklyProgram = z.infer<typeof WeeklyProgramSchema>;

export interface LessonValidationResult {
  englishOnly: boolean;
  hasObjectives: boolean;
  hasMaterials: boolean;
  hasActivities: boolean;
  hasCriticalQuestions: boolean;
  montessoriComplete: boolean;
  constructivistComplete: boolean;
  criticalThinkingComplete: boolean;
  issues: string[];
}

export interface WeeklyValidationResult {
  englishOnly: boolean;
  lessonsPassed: number;
  totalLessons: number;
  blockingIssues: string[];
}

export interface LessonPlanWithValidation extends LessonPlan {
  validation: LessonValidationResult;
}

export interface ValidatedWeeklyProgram extends WeeklyProgram {
  lessons: LessonPlanWithValidation[];
  validation: WeeklyValidationResult;
}

export interface LessonProgramMeta {
  subjectArea: string;
  gradeLevel: string;
  learnerProfile?: string;
  constraints?: string;
  generatedAt: string;
}

export type LessonProgramResponse = ValidatedWeeklyProgram & {
  markdown: string;
  html: string;
  meta: LessonProgramMeta;
};

const hasAllTrue = (obj: Record<string, boolean>) => Object.values(obj).every(Boolean);

export function validateLesson(lesson: LessonPlan): LessonValidationResult {
  const issues: string[] = [];
  const englishOnly =
    isEnglish(lesson.title) &&
    lesson.objectives.every(isEnglish) &&
    lesson.materials.every(isEnglish) &&
    isEnglish(lesson.activities.prior_knowledge) &&
    isEnglish(lesson.activities.exploration) &&
    isEnglish(lesson.activities.concept_building) &&
    isEnglish(lesson.activities.reflection) &&
    lesson.critical_questions.every(isEnglish) &&
    isEnglish(lesson.assessment);

  if (!englishOnly) issues.push('Content must remain in English.');
  if (!lesson.objectives.length) issues.push('Objectives are required.');
  if (!lesson.materials.length) issues.push('Materials are required.');
  if (!lesson.critical_questions.length) issues.push('Critical questions are required.');

  const hasActivities = Boolean(
    lesson.activities.prior_knowledge &&
      lesson.activities.exploration &&
      lesson.activities.concept_building &&
      lesson.activities.reflection
  );

  if (!hasActivities) issues.push('All constructivist activity phases are required.');

  const montessoriComplete = hasAllTrue(lesson.pedagogy_flags.montessori);
  const constructivistComplete = hasAllTrue(lesson.pedagogy_flags.constructivist);
  const criticalThinkingComplete = hasAllTrue(lesson.pedagogy_flags.critical);

  if (!montessoriComplete)
    issues.push('Montessori checklist must be fully satisfied (choice, hands-on, self-paced, self-correction).');
  if (!constructivistComplete)
    issues.push('Constructivist checklist must be fully satisfied (prior knowledge, guided discovery, social interaction).');
  if (!criticalThinkingComplete)
    issues.push('Critical-thinking checklist must be fully satisfied (open questions, evidence-based claims, peer discussion).');

  return {
    englishOnly,
    hasObjectives: Boolean(lesson.objectives.length),
    hasMaterials: Boolean(lesson.materials.length),
    hasActivities,
    hasCriticalQuestions: Boolean(lesson.critical_questions.length),
    montessoriComplete,
    constructivistComplete,
    criticalThinkingComplete,
    issues,
  };
}

export function validateWeeklyProgram(program: WeeklyProgram): ValidatedWeeklyProgram {
  const lessonsWithValidation = program.lessons.map((lesson) => ({
    ...lesson,
    validation: validateLesson(lesson),
  }));

  const blockingIssues = lessonsWithValidation
    .flatMap((lesson, index) => lesson.validation.issues.map((issue) => `Lesson ${index + 1}: ${issue}`));

  const englishOnly =
    isEnglish(program.weeklyTheme) &&
    isEnglish(program.overview) &&
    lessonsWithValidation.every((lesson) => lesson.validation.englishOnly);

  return {
    ...program,
    lessons: lessonsWithValidation,
    validation: {
      englishOnly,
      lessonsPassed: lessonsWithValidation.filter((lesson) => lesson.validation.issues.length === 0).length,
      totalLessons: lessonsWithValidation.length,
      blockingIssues,
    },
  };
}
