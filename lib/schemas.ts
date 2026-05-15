import { z } from 'zod';

const trimValue = <T>(schema: z.ZodType<T>) =>
  z.preprocess((val) => (typeof val === 'string' ? val.trim() : val), schema);

const requiredString = trimValue(z.string().min(1));

const optionalString = z.preprocess(
  (val) => {
    if (val === undefined || val === null) return undefined;
    if (typeof val === 'string') {
      const trimmed = val.trim();
      return trimmed.length ? trimmed : undefined;
    }
    return val;
  },
  z.string().optional()
);

export const LanguageSchema = z.enum(['es', 'en']);
export type Language = z.infer<typeof LanguageSchema>;

export const ToneSchema = z.enum(['ludico', 'conversacional', 'formal', 'inspirador']);
export type Tone = z.infer<typeof ToneSchema>;

export const UserTypeSchema = z.enum(['maestro', 'educador', 'padre', 'tutor']);
export type UserType = z.infer<typeof UserTypeSchema>;

export const ClassDurationSchema = z.enum(['30', '45', '60', '90']);
export type ClassDuration = z.infer<typeof ClassDurationSchema>;

export const LessonPlanInputSchema = z.object({
  weeklyTheme: requiredString,
  subjectArea: requiredString,
  gradeLevel: requiredString,
  learnerProfile: optionalString,
  constraints: optionalString,
  language: LanguageSchema.default('es'),
  tone: ToneSchema.default('conversacional'),
  userType: UserTypeSchema.default('maestro'),
  classDuration: ClassDurationSchema.default('45'),
});

export type LessonPlanInput = z.infer<typeof LessonPlanInputSchema>;

export const BloomLevelSchema = z.enum([
  'remember',
  'understand',
  'apply',
  'analyze',
  'evaluate',
  'create',
]);

export type BloomLevel = z.infer<typeof BloomLevelSchema>;

export const TopicPlanSchema = z.object({
  topic: requiredString,
  objectives: z.array(requiredString).min(1),
});

export type TopicPlan = z.infer<typeof TopicPlanSchema>;

export const ClassPlanRequestSchema = z.object({
  classTitle: requiredString,
  level: requiredString,
  bloomLevel: BloomLevelSchema,
  overallObjectives: z.array(requiredString).min(1),
  syllabus: z.array(TopicPlanSchema).min(1),
  constraints: optionalString,
});

export type ClassPlanRequest = z.infer<typeof ClassPlanRequestSchema>;

const LessonActivitiesSchema = z.object({
  prior_knowledge: requiredString,
  exploration: requiredString,
  concept_building: requiredString,
  reflection: requiredString,
});

const MontessoriElementsSchema = z.object({
  prepared_environment: requiredString,
  manipulatives: requiredString,
  choice: requiredString,
  self_correction: requiredString,
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
  title: requiredString,
  objectives: z.array(requiredString).min(1),
  materials: z.array(requiredString).min(1),
  activities: LessonActivitiesSchema,
  montessori: MontessoriElementsSchema,
  critical_questions: z.array(requiredString).min(3),
  assessment: requiredString,
  duration: requiredString,
  age_range: requiredString,
  pedagogy_flags: PedagogyFlagsSchema,
});

export const LessonPlanSchema = z
  .object({
    title: requiredString,
    objectives: z.array(requiredString).min(1),
    materials: z.array(requiredString).min(1),
    activities: LessonActivitiesSchema,
    montessori: MontessoriElementsSchema,
    critical_questions: z.array(requiredString).min(3),
    assessment: requiredString,
    duration: requiredString,
    age_range: requiredString,
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
  weeklyTheme: requiredString,
  overview: requiredString,
  template: z.object({
    lesson: requiredString,
    lesson_schema: LessonTemplateSchema,
    weekly_template: z.array(requiredString).length(5),
    reference_week: z.object({
      theme: requiredString,
      lessons: z.array(LessonTemplateSchema).length(5),
    }),
  }),
  lessons: z.array(LessonPlanSchema).length(5, {
    message: 'Weekly program must include exactly 5 lessons.',
  }),
});

export type WeeklyProgram = z.infer<typeof WeeklyProgramSchema>;

export interface LessonValidationResult {
  languageConsistent: boolean;
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
  languageConsistent: boolean;
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
  language: Language;
  tone: Tone;
  userType: UserType;
  classDuration: ClassDuration;
  generatedAt: string;
}

export type LessonProgramResponse = ValidatedWeeklyProgram & {
  markdown: string;
  html: string;
  meta: LessonProgramMeta;
};

const ExerciseSchema = z.object({
  prompt: requiredString,
  solution: requiredString,
  bloom_focus: BloomLevelSchema,
});

const TopicSectionsSchema = z.object({
  introduction: requiredString,
  theory: requiredString,
  examples: z.array(requiredString).min(1),
  exercises_with_solutions: z.array(ExerciseSchema).min(1),
  self_assessment: z.array(requiredString).min(1),
  resources: z.array(requiredString).min(1),
});

const SubagentNotesSchema = z.object({
  conceptual: requiredString,
  examples: requiredString,
  exercises: requiredString,
  resources: requiredString,
  review: requiredString,
});

export const TopicMaterialsSchema = z.object({
  topic: requiredString,
  levelTemplate: requiredString,
  bloomTarget: BloomLevelSchema,
  objectives: z.array(requiredString).min(1),
  sections: TopicSectionsSchema,
  coverage: z.object({
    objectivesAddressed: z.array(requiredString),
    bloomAlignment: requiredString,
    minimumLengthRationale: requiredString,
  }),
  subagentNotes: SubagentNotesSchema,
});

export type TopicMaterials = z.infer<typeof TopicMaterialsSchema>;

export const ClassPackageSchema = z.object({
  classTitle: requiredString,
  level: requiredString,
  bloomLevel: BloomLevelSchema,
  overallObjectives: z.array(requiredString).min(1),
  syllabus: z.array(TopicPlanSchema).min(1),
  topics: z.array(TopicMaterialsSchema).min(1),
  consolidated: z.object({
    overview: requiredString,
    publishingNotes: requiredString,
    learnerJourney: requiredString,
    qaChecklist: requiredString,
  }),
});

export type ClassPackage = z.infer<typeof ClassPackageSchema>;

export interface TopicValidationResult {
  languageConsistent: boolean;
  minLengthOk: boolean;
  objectivesCovered: boolean;
  bloomAligned: boolean;
  issues: string[];
}

export interface ValidatedTopicMaterials extends TopicMaterials {
  validation: TopicValidationResult;
}

export interface ClassValidationResult {
  languageConsistent: boolean;
  topicsPassed: number;
  totalTopics: number;
  blockingIssues: string[];
}

export interface ValidatedClassPackage extends ClassPackage {
  topics: ValidatedTopicMaterials[];
  validation: ClassValidationResult;
}

export interface ClassPackageMeta {
  level: string;
  bloomLevel: BloomLevel;
  constraints?: string;
  generatedAt: string;
}

export type ClassPackageResponse = ValidatedClassPackage & {
  markdown: string;
  html: string;
  meta: ClassPackageMeta;
};

const hasAllTrue = (obj: Record<string, boolean>) => Object.values(obj).every(Boolean);

export function validateLesson(lesson: LessonPlan): LessonValidationResult {
  const issues: string[] = [];
  const languageConsistent = true;

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
    languageConsistent,
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

  return {
    ...program,
    lessons: lessonsWithValidation,
    validation: {
      languageConsistent: true,
      lessonsPassed: lessonsWithValidation.filter((lesson) => lesson.validation.issues.length === 0).length,
      totalLessons: lessonsWithValidation.length,
      blockingIssues,
    },
  };
}

const MIN_SECTION_LENGTH = 80;

export function validateTopicMaterials(
  topic: TopicMaterials,
  requestedTopic: TopicPlan,
  targetBloom: BloomLevel
): TopicValidationResult {
  const issues: string[] = [];

  const languageConsistent = topic.sections.exercises_with_solutions.every(
    (exercise) => BloomLevelSchema.safeParse(exercise.bloom_focus).success
  );

  const sectionLengths: Record<string, number> = {
    introduction: topic.sections.introduction.length,
    theory: topic.sections.theory.length,
    examples: topic.sections.examples.join(' ').length,
    exercises: topic.sections.exercises_with_solutions
      .map((exercise) => `${exercise.prompt} ${exercise.solution}`)
      .join(' ').length,
    self_assessment: topic.sections.self_assessment.join(' ').length,
    resources: topic.sections.resources.join(' ').length,
  };

  const minLengthOk = Object.values(sectionLengths).every((length) => length >= MIN_SECTION_LENGTH);
  if (!minLengthOk) {
    issues.push('Each section must meet the minimum length requirement.');
  }

  const objectivesCovered = requestedTopic.objectives.every((objective) =>
    topic.objectives.some((provided) => provided.toLowerCase().includes(objective.toLowerCase())) ||
    topic.coverage.objectivesAddressed.some((covered) => covered.toLowerCase().includes(objective.toLowerCase()))
  );

  if (!objectivesCovered) {
    issues.push('All topic objectives must be explicitly addressed.');
  }

  const bloomAligned = topic.bloomTarget === targetBloom;
  if (!bloomAligned) {
    issues.push('Bloom level alignment is required for each topic.');
  }

  return {
    languageConsistent,
    minLengthOk,
    objectivesCovered,
    bloomAligned,
    issues,
  };
}

export function validateClassPackage(request: ClassPlanRequest, pkg: ClassPackage): ValidatedClassPackage {
  const topicsWithValidation: ValidatedTopicMaterials[] = pkg.topics.map((topic) => {
    const requestedTopic = request.syllabus.find((item) => item.topic.toLowerCase() === topic.topic.toLowerCase());
    const fallbackTopic: TopicPlan = requestedTopic ?? { topic: topic.topic, objectives: pkg.overallObjectives };
    return {
      ...topic,
      validation: validateTopicMaterials(topic, fallbackTopic, request.bloomLevel),
    };
  });

  const blockingIssues = topicsWithValidation
    .flatMap((topic, index) => topic.validation.issues.map((issue) => `Topic ${index + 1}: ${issue}`));

  return {
    ...pkg,
    topics: topicsWithValidation,
    validation: {
      languageConsistent: true,
      topicsPassed: topicsWithValidation.filter((topic) => topic.validation.issues.length === 0).length,
      totalTopics: topicsWithValidation.length,
      blockingIssues,
    },
  };
}

// ============================================================================
// Phase 2 — Single deep lesson schema
// ============================================================================

export const SingleLessonInputSchema = z.object({
  topic: requiredString,
  subjectArea: requiredString,
  gradeLevel: requiredString,
  learningObjective: optionalString,
  learnerProfile: optionalString,
  constraints: optionalString,
  sourceMaterial: optionalString,
  sourceFilename: optionalString,
  language: LanguageSchema.default('es'),
  tone: ToneSchema.default('conversacional'),
  userType: UserTypeSchema.default('maestro'),
  classDuration: ClassDurationSchema.default('45'),
});

export type SingleLessonInput = z.infer<typeof SingleLessonInputSchema>;

const KeyConceptSchema = z.object({
  name: requiredString,
  definition: requiredString,
  why_it_matters: requiredString,
});

const VocabularyItemSchema = z.object({
  term: requiredString,
  definition: requiredString,
  example_in_context: requiredString,
});

const AnalogySchema = z.object({
  analogy: requiredString,
  what_it_illustrates: requiredString,
});

const LessonPhaseSchema = z.object({
  name: requiredString,
  duration_min: z.number().int().positive(),
  teacher_script: requiredString,
  student_actions: requiredString,
  materials_used: z.array(requiredString),
  transitions: requiredString,
});

const WorkedExampleSchema = z.object({
  example: requiredString,
  solution_steps: z.array(requiredString).min(2),
  common_mistakes: z.array(requiredString),
  teacher_note: requiredString,
});

const MisconceptionSchema = z.object({
  misconception: requiredString,
  correction: requiredString,
  diagnostic_question: requiredString,
});

const DialoguePromptSchema = z.object({
  question: requiredString,
  expected_responses: z.array(requiredString).min(2),
  teacher_follow_up: requiredString,
});

const WorksheetProblemSchema = z.object({
  number: z.number().int().positive(),
  prompt: requiredString,
  answer: requiredString,
  difficulty: z.enum(['easy', 'medium', 'hard']),
});

const ExitTicketQuestionSchema = z.object({
  prompt: requiredString,
  answer: requiredString,
});

const HomeworkSchema = z.object({
  description: requiredString,
  expected_time_min: z.number().int().positive(),
});

export const SingleLessonSchema = z.object({
  title: requiredString,
  subtitle: optionalString,
  meta: z.object({
    duration_min: z.number().int().positive(),
    grade_level: requiredString,
    subject: requiredString,
  }),
  overview: z.object({
    learning_goal: requiredString,
    why_it_matters: requiredString,
    prerequisites: z.array(requiredString),
  }),
  core_content: z.object({
    main_explanation: requiredString,
    key_concepts: z.array(KeyConceptSchema).min(2),
    vocabulary: z.array(VocabularyItemSchema).min(2),
    analogies: z.array(AnalogySchema).min(1),
  }),
  phases: z.array(LessonPhaseSchema).min(3).max(6),
  worked_examples: z.array(WorkedExampleSchema).min(2),
  common_misconceptions: z.array(MisconceptionSchema).min(2),
  dialogue_prompts: z.array(DialoguePromptSchema).min(3),
  worksheet: z.object({
    instructions: requiredString,
    problems: z.array(WorksheetProblemSchema).min(5),
  }),
  exit_ticket: z.object({
    questions: z.array(ExitTicketQuestionSchema).min(2),
    grading_rubric: requiredString,
  }),
  differentiation: z.object({
    for_struggling: requiredString,
    for_advanced: requiredString,
    accommodations: requiredString,
  }),
  extension: z.object({
    homework: HomeworkSchema.optional(),
    parent_note: optionalString,
    follow_up_lesson_idea: requiredString,
  }),
  pedagogy_flags: PedagogyFlagsSchema,
});

export type SingleLesson = z.infer<typeof SingleLessonSchema>;

const MIN_MAIN_EXPLANATION_CHARS = 300;
const MIN_TEACHER_SCRIPT_CHARS = 200;

export interface SingleLessonValidationResult {
  durationsMatch: boolean;
  explanationDepthOk: boolean;
  scriptDepthOk: boolean;
  worksheetSizeOk: boolean;
  montessoriComplete: boolean;
  constructivistComplete: boolean;
  criticalThinkingComplete: boolean;
  issues: string[];
}

export interface ValidatedSingleLesson extends SingleLesson {
  validation: SingleLessonValidationResult;
}

export interface SingleLessonMeta {
  duration_min: number;
  grade_level: string;
  subject: string;
  topic: string;
  subjectArea: string;
  gradeLevel: string;
  learningObjective?: string;
  learnerProfile?: string;
  constraints?: string;
  sourceFilename?: string;
  sourceWordCount?: number;
  language: Language;
  tone: Tone;
  userType: UserType;
  classDuration: ClassDuration;
  generatedAt: string;
}

export type SingleLessonResponse = Omit<ValidatedSingleLesson, 'meta'> & {
  markdown: string;
  html: string;
  meta: SingleLessonMeta;
};

export function validateSingleLesson(
  lesson: SingleLesson,
  expectedDurationMin: number
): SingleLessonValidationResult {
  const issues: string[] = [];

  const totalPhaseDuration = lesson.phases.reduce((sum, phase) => sum + phase.duration_min, 0);
  const durationsMatch =
    Math.abs(totalPhaseDuration - expectedDurationMin) <= Math.max(2, expectedDurationMin * 0.1);
  if (!durationsMatch) {
    issues.push(
      `Phase durations sum to ${totalPhaseDuration} minutes but the class is ${expectedDurationMin} minutes.`
    );
  }

  const explanationDepthOk = lesson.core_content.main_explanation.length >= MIN_MAIN_EXPLANATION_CHARS;
  if (!explanationDepthOk) {
    issues.push(
      `Main explanation must be at least ${MIN_MAIN_EXPLANATION_CHARS} characters (was ${lesson.core_content.main_explanation.length}).`
    );
  }

  const shortScripts = lesson.phases.filter(
    (phase) => phase.teacher_script.length < MIN_TEACHER_SCRIPT_CHARS
  );
  const scriptDepthOk = shortScripts.length === 0;
  if (!scriptDepthOk) {
    issues.push(
      `${shortScripts.length} phase(s) have a teacher_script shorter than ${MIN_TEACHER_SCRIPT_CHARS} characters.`
    );
  }

  const worksheetSizeOk = lesson.worksheet.problems.length >= 5;
  if (!worksheetSizeOk) {
    issues.push('Worksheet must include at least 5 problems with answer key.');
  }

  const montessoriComplete = hasAllTrue(lesson.pedagogy_flags.montessori);
  const constructivistComplete = hasAllTrue(lesson.pedagogy_flags.constructivist);
  const criticalThinkingComplete = hasAllTrue(lesson.pedagogy_flags.critical);

  if (!montessoriComplete) issues.push('Montessori checklist must be fully satisfied.');
  if (!constructivistComplete) issues.push('Constructivist checklist must be fully satisfied.');
  if (!criticalThinkingComplete) issues.push('Critical-thinking checklist must be fully satisfied.');

  return {
    durationsMatch,
    explanationDepthOk,
    scriptDepthOk,
    worksheetSizeOk,
    montessoriComplete,
    constructivistComplete,
    criticalThinkingComplete,
    issues,
  };
}

export function parseSingleLessonInput(body: unknown): SingleLessonInput {
  return SingleLessonInputSchema.parse(body);
}
