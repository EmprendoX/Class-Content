import OpenAI from 'openai';
import { z } from 'zod';
import {
  CLASS_ORCHESTRATOR_PROMPT,
  WEEKLY_LESSON_SYSTEM_PROMPT,
  WEEKLY_MARKDOWN_FORMAT_PROMPT,
} from './prompts';
import {
  ClassPackage,
  ClassPackageSchema,
  ClassPlanRequest,
  ClassPlanRequestSchema,
  LessonPlanInput,
  LessonPlanInputSchema,
  ValidatedClassPackage,
  ValidatedWeeklyProgram,
  WeeklyProgram,
  WeeklyProgramSchema,
  validateWeeklyProgram,
  validateClassPackage,
} from './schemas';

const MAX_LLM_ATTEMPTS = 3;
const RETRY_BASE_DELAY_MS = 500;

type LLMErrorCode = 'api-error' | 'empty-response' | 'invalid-json' | 'schema-validation';

export class LLMServiceError extends Error {
  readonly code: LLMErrorCode;
  readonly meta?: Record<string, unknown>;

  constructor(message: string, code: LLMErrorCode, meta?: Record<string, unknown>) {
    super(message);
    this.name = 'LLMServiceError';
    this.code = code;
    this.meta = meta;
  }
}

function logLLMFailure(provider: string, attempt: number, error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  console.warn(`[LLM:${provider}] attempt ${attempt} failed: ${message}`);
}

async function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function stripAccents(value: string): string {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^\x00-\x7F]+/g, '');
}

export function sanitizeEnglishContent<T>(payload: T): T {
  if (typeof payload === 'string') {
    return stripAccents(payload) as unknown as T;
  }

  if (Array.isArray(payload)) {
    return payload.map((item) => sanitizeEnglishContent(item)) as unknown as T;
  }

  if (payload && typeof payload === 'object') {
    const sanitizedEntries = Object.entries(payload as Record<string, unknown>).map(([key, value]) => [
      key,
      sanitizeEnglishContent(value),
    ]);

    return Object.fromEntries(sanitizedEntries) as T;
  }

  return payload;
}

function ensureStringArray(
  value: unknown,
  fallbackPrefix: string,
  requiredLength: number
): string[] {
  const items = Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
    : [];

  if (items.length >= requiredLength) {
    return items;
  }

  const result = [...items];
  while (result.length < requiredLength) {
    result.push(`${fallbackPrefix} ${result.length + 1}`);
  }

  return result;
}

function ensureString(value: unknown, fallback: string): string {
  return typeof value === 'string' && value.trim().length > 0 ? value : fallback;
}

function ensureActivities(value: unknown): Record<string, string> {
  const activities = typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : {};

  return {
    prior_knowledge: ensureString(activities.prior_knowledge, 'Recall prior learning with a quick prompt.'),
    exploration: ensureString(
      activities.exploration,
      'Hands-on or inquiry activity with manipulatives and peer collaboration.'
    ),
    concept_building: ensureString(
      activities.concept_building,
      'Facilitated connection to the key concept using learner discoveries.'
    ),
    reflection: ensureString(activities.reflection, 'Reflection and self-correction with peers.'),
  };
}

function ensurePedagogyFlags(value: unknown): Record<string, Record<string, boolean>> {
  const flags = typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : {};

  return {
    montessori: {
      choice: true,
      hands_on: true,
      prepared_environment: true,
      self_correction: true,
      ...(typeof flags.montessori === 'object' && flags.montessori !== null
        ? (flags.montessori as Record<string, boolean>)
        : {}),
    },
    constructivist: {
      link_to_prior_knowledge: true,
      guided_discovery: true,
      social_interaction: true,
      peer_collaboration: true,
      ...(typeof flags.constructivist === 'object' && flags.constructivist !== null
        ? (flags.constructivist as Record<string, boolean>)
        : {}),
    },
    critical: {
      open_questions: true,
      evidence_based_claims: true,
      peer_discussion: true,
      ...(typeof flags.critical === 'object' && flags.critical !== null
        ? (flags.critical as Record<string, boolean>)
        : {}),
    },
  };
}

function coerceLessonTemplate(rawLesson: unknown, index: number): Record<string, unknown> {
  const lesson = typeof rawLesson === 'object' && rawLesson !== null ? (rawLesson as Record<string, unknown>) : {};

  return {
    title: ensureString(lesson.title, `Reference Lesson ${index + 1}`),
    objectives: ensureStringArray(lesson.objectives, 'Objective', 1),
    materials: ensureStringArray(lesson.materials, 'Material', 1),
    activities: ensureActivities(lesson.activities),
    montessori: {
      prepared_environment: ensureString(
        lesson.montessori && typeof lesson.montessori === 'object'
          ? (lesson.montessori as Record<string, unknown>).prepared_environment
          : undefined,
        'Prepared environment with clear choices and labels.'
      ),
      manipulatives: ensureString(
        lesson.montessori && typeof lesson.montessori === 'object'
          ? (lesson.montessori as Record<string, unknown>).manipulatives
          : undefined,
        'Hands-on manipulatives available at stations.'
      ),
      choice: ensureString(
        lesson.montessori && typeof lesson.montessori === 'object' ? (lesson.montessori as Record<string, unknown>).choice : undefined,
        'Learners pick at least one path or material set.'
      ),
      self_correction: ensureString(
        lesson.montessori && typeof lesson.montessori === 'object'
          ? (lesson.montessori as Record<string, unknown>).self_correction
          : undefined,
        'Self-check cues or cards are provided.'
      ),
    },
    critical_questions: ensureStringArray(lesson.critical_questions, 'Open question', 3),
    assessment: ensureString(lesson.assessment, 'Observation notes and a quick exit ticket.'),
    duration: ensureString(lesson.duration, '50 minutes'),
    age_range: ensureString(lesson.age_range, 'Ages 9-11'),
    pedagogy_flags: ensurePedagogyFlags(lesson.pedagogy_flags),
  };
}

function normalizeLessonsArray(rawLessons: unknown, label: string): Array<Record<string, unknown>> {
  const lessons = Array.isArray(rawLessons) ? rawLessons : [];
  const normalized = lessons.map((lesson, idx) => coerceLessonTemplate(lesson, idx));

  while (normalized.length < 5) {
    normalized.push(coerceLessonTemplate({}, normalized.length));
  }

  if (normalized.length > 5) {
    return normalized.slice(0, 5).map((lesson, idx) => ({
      ...lesson,
      title: ensureString(lesson.title, `${label} ${idx + 1}`),
    }));
  }

  return normalized.map((lesson, idx) => ({
    ...lesson,
    title: ensureString(lesson.title, `${label} ${idx + 1}`),
  }));
}

function normalizeWeeklyProgramDraft(parsed: unknown): unknown {
  if (parsed === null || typeof parsed !== 'object') return parsed;

  const draft = parsed as Record<string, unknown>;
  const template = draft.template;

  if (template && typeof template === 'object') {
    const templateObj = template as Record<string, unknown>;

    if (Array.isArray(templateObj.weekly_template)) {
      while (templateObj.weekly_template.length < 5) {
        templateObj.weekly_template.push(`Class ${templateObj.weekly_template.length + 1}`);
      }
      if (templateObj.weekly_template.length > 5) {
        templateObj.weekly_template = templateObj.weekly_template.slice(0, 5);
      }
    }

    if (templateObj.reference_week && typeof templateObj.reference_week === 'object') {
      const referenceWeek = templateObj.reference_week as Record<string, unknown>;
      referenceWeek.lessons = normalizeLessonsArray(referenceWeek.lessons, 'Reference Lesson');
      templateObj.reference_week = referenceWeek;
    }

    draft.template = templateObj;
  }

  if (draft.lessons) {
    draft.lessons = normalizeLessonsArray(draft.lessons, 'Lesson');
  }

  return draft;
}

function validateApiKey(): void {
  const apiKey = process.env.OPENAI_API_KEY;
  
  if (!apiKey) {
    const message = 'OPENAI_API_KEY is required. Please set it in your .env.local file.';
    if (process.env.NODE_ENV === 'production') {
      throw new Error(message);
    }
    console.warn(`[LLM] ${message}`);
    return;
  }

  // Validar formato básico de API key de OpenAI (debe empezar con sk-)
  if (!apiKey.startsWith('sk-')) {
    const message = 'OPENAI_API_KEY has invalid format. OpenAI API keys should start with "sk-".';
    if (process.env.NODE_ENV === 'production') {
      throw new Error(message);
    }
    console.warn(`[LLM] ${message}`);
  }
}

// Validar API key al cargar el módulo
validateApiKey();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

export async function generateText(
  prompt: string,
  systemPrompt: string,
  model: string = 'gpt-4o-mini',
  useStructuredOutput: boolean = false
): Promise<string> {
  const completionParams: OpenAI.Chat.Completions.ChatCompletionCreateParams = {
    model,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: prompt },
    ],
  };

  if (useStructuredOutput && (model.includes('gpt-4') || model.includes('gpt-3.5'))) {
    completionParams.response_format = { type: 'json_object' };
  }

  let lastError: unknown;
  let triedOpenRouter = false;

  for (let attempt = 1; attempt <= MAX_LLM_ATTEMPTS; attempt++) {
    try {
      const completion = await openai.chat.completions.create(completionParams);
      const content = completion.choices[0]?.message?.content;
      if (!content) {
        throw new LLMServiceError('Empty response from OpenAI', 'empty-response', {
          provider: 'openai',
          attempt,
          model,
        });
      }

      return content;
    } catch (error) {
      // Capturar errores específicos de OpenAI SDK
      let statusCode: number | undefined;
      let errorCode: string | undefined;
      let errorMessage: string | undefined;

      // El SDK de OpenAI lanza errores con propiedades status, code, message
      if (error && typeof error === 'object') {
        const apiError = error as {
          status?: number;
          code?: string;
          message?: string;
          error?: { code?: string; message?: string };
        };

        statusCode = apiError.status;
        errorCode = apiError.code || apiError.error?.code;
        errorMessage = apiError.message || apiError.error?.message;
      }

      logLLMFailure('openai', attempt, error);

      // Manejar errores específicos según status code
      if (statusCode === 401 || statusCode === 403) {
        // API key inválida o faltante
        throw new LLMServiceError(
          'Invalid OpenAI API key. Please check your OPENAI_API_KEY in .env.local',
          'api-error',
          {
            provider: 'openai',
            attempt,
            model,
            status: statusCode,
            code: errorCode,
            message: errorMessage,
          }
        );
      }

      if (statusCode === 429) {
        // Rate limit - esperar más tiempo antes de reintentar
        lastError = new LLMServiceError(
          'OpenAI rate limit exceeded. Please try again in a few moments.',
          'api-error',
          {
            provider: 'openai',
            attempt,
            model,
            status: statusCode,
            code: errorCode,
            message: errorMessage,
          }
        );

        // Intentar OpenRouter como fallback solo una vez
        if (OPENROUTER_API_KEY && !triedOpenRouter && attempt === 1) {
          triedOpenRouter = true;
          try {
            return await generateTextOpenRouter(prompt, systemPrompt, model);
          } catch (routerError) {
            logLLMFailure('openrouter', attempt, routerError);
            // Continuar con reintentos de OpenAI
          }
        }

        // Esperar más tiempo para rate limits (exponential backoff)
        if (attempt < MAX_LLM_ATTEMPTS) {
          const waitTime = RETRY_BASE_DELAY_MS * Math.pow(2, attempt) * 2; // Más tiempo para rate limits
          await wait(waitTime);
        }
        continue;
      }

      if (statusCode === 400) {
        // Bad request - no reintentar
        throw new LLMServiceError(
          `Invalid request to OpenAI API: ${errorMessage || 'Bad request'}`,
          'api-error',
          {
            provider: 'openai',
            attempt,
            model,
            status: statusCode,
            code: errorCode,
            message: errorMessage,
          }
        );
      }

      if (statusCode && statusCode >= 500) {
        // Server error - reintentar
        lastError = new LLMServiceError(
          `OpenAI server error (${statusCode}). Retrying...`,
          'api-error',
          {
            provider: 'openai',
            attempt,
            model,
            status: statusCode,
            code: errorCode,
            message: errorMessage,
          }
        );

        // Intentar OpenRouter como fallback solo una vez
        if (OPENROUTER_API_KEY && !triedOpenRouter && attempt === 1) {
          triedOpenRouter = true;
          try {
            return await generateTextOpenRouter(prompt, systemPrompt, model);
          } catch (routerError) {
            logLLMFailure('openrouter', attempt, routerError);
            // Continuar con reintentos de OpenAI
          }
        }

        if (attempt < MAX_LLM_ATTEMPTS) {
          await wait(RETRY_BASE_DELAY_MS * attempt);
        }
        continue;
      }

      // Error genérico - guardar y continuar con reintentos
      lastError = error;

      // Intentar OpenRouter como fallback solo una vez
      if (OPENROUTER_API_KEY && !triedOpenRouter && attempt === 1) {
        triedOpenRouter = true;
        try {
          return await generateTextOpenRouter(prompt, systemPrompt, model);
        } catch (routerError) {
          logLLMFailure('openrouter', attempt, routerError);
          lastError = routerError;
        }
      }

      if (attempt < MAX_LLM_ATTEMPTS) {
        await wait(RETRY_BASE_DELAY_MS * attempt);
      }
    }
  }

  if (lastError instanceof LLMServiceError) {
    // Preservar el mensaje de error específico si ya es un LLMServiceError
    throw new LLMServiceError(lastError.message, lastError.code, {
      ...(lastError.meta ?? {}),
      model,
      attempts: MAX_LLM_ATTEMPTS,
    });
  }

  // Mejorar mensaje de error final con información útil
  const errorMessage = lastError instanceof Error ? lastError.message : String(lastError);
  const finalMessage = `Failed to generate text after ${MAX_LLM_ATTEMPTS} attempts. ${errorMessage || 'Unknown error occurred'}`;
  
  throw new LLMServiceError(finalMessage, 'api-error', {
    model,
    attempts: MAX_LLM_ATTEMPTS,
    lastError: errorMessage,
  });
}

async function generateTextOpenRouter(
  prompt: string,
  systemPrompt: string,
  model: string = 'gpt-4o-mini'
): Promise<string> {
  if (!OPENROUTER_API_KEY) {
    throw new LLMServiceError('OpenRouter API key not configured', 'api-error', {
      provider: 'openrouter',
    });
  }

  let response: Response;

  try {
    response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: `openai/${model}`,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt },
        ],
      }),
    });
  } catch (networkError) {
    throw new LLMServiceError('OpenRouter network request failed', 'api-error', {
      provider: 'openrouter',
      error: networkError instanceof Error ? networkError.message : String(networkError),
    });
  }

  if (!response.ok) {
    const errorText = await response.text();
    throw new LLMServiceError('OpenRouter API responded with an error', 'api-error', {
      provider: 'openrouter',
      status: response.status,
      body: errorText.slice(0, 500),
    });
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    throw new LLMServiceError('Empty response from OpenRouter', 'empty-response', {
      provider: 'openrouter',
    });
  }

  return content;
}

function extractJsonPayload(raw: string): string {
  let jsonStr = raw.trim();
  if (jsonStr.startsWith('```')) {
    jsonStr = jsonStr.replace(/^```(?:json)?\n/, '').replace(/\n```$/, '');
  }

  const start = jsonStr.indexOf('{');
  const end = jsonStr.lastIndexOf('}');

  if (start !== -1 && end !== -1 && end > start) {
    return jsonStr.slice(start, end + 1);
  }

  return jsonStr;
}

function parseWithSchema<T extends z.ZodTypeAny>(
  raw: string,
  schema: T,
  context: { provider: string; stage: string }
): z.infer<T> {
  const jsonStr = extractJsonPayload(raw);

  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonStr);
  } catch (parseError) {
    console.error(`[LLM:${context.stage}] Failed JSON parse`, jsonStr);
    throw new LLMServiceError('Invalid JSON response from model', 'invalid-json', {
      provider: context.provider,
      stage: context.stage,
      error: parseError instanceof Error ? parseError.message : String(parseError),
      rawSnippet: jsonStr.slice(0, 400),
    });
  }

  try {
    const normalized = normalizeWeeklyProgramDraft(parsed);
    const sanitized = sanitizeEnglishContent(normalized) as T;
    return schema.parse(sanitized);
  } catch (validationError) {
    console.error(`[LLM:${context.stage}] Schema validation failed`, parsed);
    const issues = validationError instanceof z.ZodError ? validationError.issues : undefined;
    const zodIssues = issues?.map((issue) => {
      const path = issue.path.join('.') || 'root';
      return `${path}: ${issue.message}`;
    });

    const rawSnippet = (() => {
      const payload = extractJsonPayload(raw);
      return payload.slice(0, 400);
    })();

    const detailMessage = zodIssues?.length ? `: ${zodIssues.join(' | ')}` : '';

    throw new LLMServiceError(`Response does not match expected schema${detailMessage}`, 'schema-validation', {
      provider: context.provider,
      stage: context.stage,
      error: validationError instanceof Error ? validationError.message : String(validationError),
      issues: zodIssues,
      rawSnippet,
    });
  }
}

export async function generateWeeklyProgram(input: LessonPlanInput): Promise<ValidatedWeeklyProgram> {
  const prompt = `Weekly theme: ${input.weeklyTheme}\nSubject area: ${input.subjectArea}\nGrade level: ${input.gradeLevel}\nLearner profile: ${input.learnerProfile ?? 'Not provided; assume mixed readiness with opportunities for choice.'}\nConstraints: ${input.constraints ?? 'None provided; keep materials lightweight and classroom-ready.'}\nInstruction: Deliver content-rich lessons with explicit talking points, facts, and named sources (no URLs) instead of meta-instructions or generic prompts.`;

  let attempt = 0;
  let lastIssues: string[] = [];
  let lastDraft: WeeklyProgram | null = null;
  let lastRaw = '';

  while (attempt < MAX_LLM_ATTEMPTS) {
    const repairContext =
      attempt === 0
        ? ''
        : `\nPrevious draft failed validation:\n- ${lastIssues.join('\n- ')}\nReturn corrected, fully populated JSON only. Here is the last attempt for reference:\n${JSON.stringify(lastDraft, null, 2)}`;

    const response = await generateText(`${prompt}${repairContext}`, WEEKLY_LESSON_SYSTEM_PROMPT, 'gpt-4o-mini', true);
    lastRaw = response;

    const structuredPlan: WeeklyProgram = parseWithSchema(response, WeeklyProgramSchema, {
      provider: 'openai',
      stage: 'weekly-plan',
    });

    const validated = validateWeeklyProgram(structuredPlan);
    if (validated.validation.blockingIssues.length === 0) {
      return validated;
    }

    attempt += 1;
    lastDraft = structuredPlan;
    lastIssues = validated.validation.blockingIssues;
    await wait(RETRY_BASE_DELAY_MS * attempt);
  }

  throw new LLMServiceError('Lesson plan failed pedagogy validation after retries', 'schema-validation', {
    issues: lastIssues,
    lastRaw,
  });
}

export async function generateClassMaterialsPackage(
  input: ClassPlanRequest
): Promise<ValidatedClassPackage> {
  const prompt = JSON.stringify(input, null, 2);

  let attempt = 0;
  let lastIssues: string[] = [];
  let lastDraft: ClassPackage | null = null;
  let lastRaw = '';

  while (attempt < MAX_LLM_ATTEMPTS) {
    const repairContext =
      attempt === 0
        ? ''
        : `\nPrevious draft failed validation:\n- ${lastIssues.join('\n- ')}\nReturn corrected, fully populated JSON only. Here is the last attempt for reference:\n${JSON.stringify(lastDraft, null, 2)}`;

    const response = await generateText(`${prompt}${repairContext}`, CLASS_ORCHESTRATOR_PROMPT, 'gpt-4o-mini', true);
    lastRaw = response;

    const structured: ClassPackage = parseWithSchema(response, ClassPackageSchema, {
      provider: 'openai',
      stage: 'class-package',
    });

    const validated = validateClassPackage(input, structured);
    if (validated.validation.blockingIssues.length === 0) {
      return validated;
    }

    attempt += 1;
    lastDraft = structured;
    lastIssues = validated.validation.blockingIssues;
    await wait(RETRY_BASE_DELAY_MS * attempt);
  }

  throw new LLMServiceError('Class materials failed validation after retries', 'schema-validation', {
    issues: lastIssues,
    lastRaw,
  });
}

export async function formatWeeklyMarkdown(program: ValidatedWeeklyProgram): Promise<string> {
  const prompt = JSON.stringify(program, null, 2);

  const response = await generateText(prompt, WEEKLY_MARKDOWN_FORMAT_PROMPT, 'gpt-4o-mini', false);
  return response.trim();
}

export function parseLessonPlanInput(body: unknown): LessonPlanInput {
  return LessonPlanInputSchema.parse(body);
}

export function parseClassPlanInput(body: unknown): ClassPlanRequest {
  return ClassPlanRequestSchema.parse(body);
}
