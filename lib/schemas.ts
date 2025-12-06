import { z } from 'zod';

const isEnglish = (value: string) => /^[\x00-\x7F]+$/.test(value);

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

const MontessoriElementsSchema = z.object({
  prepared_environment: requiredEnglishString,
  manipulatives: requiredEnglishString,
  choice: requiredEnglishString,
  self_correction: requiredEnglishString,
});

const PedagogyFlagsSchema = z.object({
  montessori: z.object({
    choice: z.boolean(),
    hands_on: z.boolean(),
    prepared_environment: z.boolean(),
    self_correction: z.boolean(),
  }),
  constructivist: z.object({
    link_to_prior_knowledge: z.boolean(),
    guided_discovery: z.boolean(),
    social_interaction: z.boolean(),
    peer_collaboration: z.boolean(),
  }),
  critical: z.object({
    open_questions: z.boolean(),
    evidence_based_claims: z.boolean(),
    peer_discussion: z.boolean(),
  }),
});

const LessonTemplateSchema = z.object({
  title: requiredEnglishString,
  objectives: z.array(requiredEnglishString).min(1),
  materials: z.array(requiredEnglishString).min(1),
  activities: LessonActivitiesSchema,
  montessori: MontessoriElementsSchema,
  critical_questions: z.array(requiredEnglishString).min(3),
  assessment: requiredEnglishString,
  duration: requiredEnglishString,
  age_range: requiredEnglishString,
  pedagogy_flags: PedagogyFlagsSchema,
});

export const LessonPlanSchema = z
  .object({
    title: requiredEnglishString,
    objectives: z.array(requiredEnglishString).min(1),
    materials: z.array(requiredEnglishString).min(1),
    activities: LessonActivitiesSchema,
    montessori: MontessoriElementsSchema,
    critical_questions: z.array(requiredEnglishString).min(3),
    assessment: requiredEnglishString,
    duration: requiredEnglishString,
    age_range: requiredEnglishString,
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
  .refine((lesson) => lesson.pedagogy_flags.montessori.prepared_environment, {
    message: 'Montessori prepared_environment flag must be true.',
    path: ['pedagogy_flags', 'montessori', 'prepared_environment'],
  })
  .refine((lesson) => lesson.pedagogy_flags.montessori.self_correction, {
    message: 'Montessori self_correction flag must be true.',
    path: ['pedagogy_flags', 'montessori', 'self_correction'],
  })
  .refine((lesson) => lesson.pedagogy_flags.constructivist.link_to_prior_knowledge, {
    message: 'Constructivist prior knowledge flag must be true.',
    path: ['pedagogy_flags', 'constructivist', 'link_to_prior_knowledge'],
  })
  .refine((lesson) => lesson.pedagogy_flags.constructivist.guided_discovery, {
    message: 'Constructivist guided_discovery flag must be true.',
    path: ['pedagogy_flags', 'constructivist', 'guided_discovery'],
  })
  .refine((lesson) => lesson.pedagogy_flags.constructivist.social_interaction, {
    message: 'Constructivist social_interaction flag must be true.',
    path: ['pedagogy_flags', 'constructivist', 'social_interaction'],
  })
  .refine((lesson) => lesson.pedagogy_flags.constructivist.peer_collaboration, {
    message: 'Constructivist peer collaboration flag must be true.',
    path: ['pedagogy_flags', 'constructivist', 'peer_collaboration'],
  })
  .refine((lesson) => lesson.pedagogy_flags.critical.open_questions, {
    message: 'Critical thinking open questions flag must be true.',
    path: ['pedagogy_flags', 'critical', 'open_questions'],
  })
  .refine((lesson) => lesson.pedagogy_flags.critical.evidence_based_claims, {
    message: 'Critical thinking evidence_based_claims flag must be true.',
    path: ['pedagogy_flags', 'critical', 'evidence_based_claims'],
  })
  .refine((lesson) => lesson.pedagogy_flags.critical.peer_discussion, {
    message: 'Critical thinking peer_discussion flag must be true.',
    path: ['pedagogy_flags', 'critical', 'peer_discussion'],
  });

export type LessonPlan = z.infer<typeof LessonPlanSchema>;

export const WeeklyProgramSchema = z.object({
  weeklyTheme: requiredEnglishString,
  overview: requiredEnglishString,
  template: z.object({
    lesson: requiredEnglishString,
    lesson_schema: LessonTemplateSchema,
    weekly_template: z.array(requiredEnglishString).length(5),
    reference_week: z.object({
      theme: requiredEnglishString,
      lessons: z.array(LessonTemplateSchema).length(5),
    }),
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
  hasMontessoriElements: boolean;
  hasDuration: boolean;
  hasAgeRange: boolean;
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
    isEnglish(lesson.montessori.prepared_environment) &&
    isEnglish(lesson.montessori.manipulatives) &&
    isEnglish(lesson.montessori.choice) &&
    isEnglish(lesson.montessori.self_correction) &&
    lesson.critical_questions.every(isEnglish) &&
    isEnglish(lesson.assessment) &&
    isEnglish(lesson.duration) &&
    isEnglish(lesson.age_range);

  if (!englishOnly) issues.push('Content must remain in English.');
  if (!lesson.objectives.length) issues.push('Objectives are required.');
  if (!lesson.materials.length) issues.push('Materials are required.');
  if (lesson.critical_questions.length < 3) issues.push('At least 3 critical-thinking questions are required.');

  const hasActivities = Boolean(
    lesson.activities.prior_knowledge &&
      lesson.activities.exploration &&
      lesson.activities.concept_building &&
      lesson.activities.reflection
  );

  if (!hasActivities) issues.push('All constructivist activity phases are required.');

  const hasMontessoriElements = Boolean(
    lesson.montessori.prepared_environment &&
      lesson.montessori.manipulatives &&
      lesson.montessori.choice &&
      lesson.montessori.self_correction
  );

  if (!hasMontessoriElements) issues.push('Montessori elements (prepared environment, manipulatives, choice, self-correction) are required.');

  if (!lesson.duration) issues.push('Duration is required.');
  if (!lesson.age_range) issues.push('Age range is required.');

  const montessoriComplete = hasAllTrue(lesson.pedagogy_flags.montessori);
  const constructivistComplete = hasAllTrue(lesson.pedagogy_flags.constructivist);
  const criticalThinkingComplete = hasAllTrue(lesson.pedagogy_flags.critical);

  if (!montessoriComplete)
    issues.push('Montessori checklist must be fully satisfied (choice, hands-on, prepared environment, self-correction).');
  if (!constructivistComplete)
    issues.push('Constructivist checklist must be fully satisfied (prior knowledge, guided discovery, social interaction, peer collaboration).');
  if (!criticalThinkingComplete)
    issues.push('Critical-thinking checklist must be fully satisfied (open questions, evidence-based claims, peer discussion).');

  return {
    englishOnly,
    hasObjectives: Boolean(lesson.objectives.length),
    hasMaterials: Boolean(lesson.materials.length),
    hasActivities,
    hasMontessoriElements,
    hasDuration: Boolean(lesson.duration),
    hasAgeRange: Boolean(lesson.age_range),
    hasCriticalQuestions: lesson.critical_questions.length >= 3,
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
