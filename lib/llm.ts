import OpenAI from 'openai';
import type { ZodSchema } from 'zod';
import { WEEKLY_LESSON_SYSTEM_PROMPT, WEEKLY_MARKDOWN_FORMAT_PROMPT } from './prompts';
import {
  LessonPlanInput,
  LessonPlanInputSchema,
  ValidatedWeeklyProgram,
  WeeklyProgram,
  WeeklyProgramSchema,
  validateWeeklyProgram,
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

if (!process.env.OPENAI_API_KEY) {
  console.warn('OPENAI_API_KEY not found in environment variables');
}

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
      logLLMFailure('openai', attempt, error);
      lastError = error;

      if (OPENROUTER_API_KEY) {
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
    throw new LLMServiceError(lastError.message, lastError.code, {
      ...(lastError.meta ?? {}),
      model,
      attempts: MAX_LLM_ATTEMPTS,
    });
  }

  throw new LLMServiceError('Failed to generate text after retries', 'api-error', {
    model,
    attempts: MAX_LLM_ATTEMPTS,
    lastError: lastError instanceof Error ? lastError.message : String(lastError),
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

  const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    return jsonMatch[0];
  }

  return jsonStr;
}

function parseWithSchema<T>(
  raw: string,
  schema: ZodSchema<T>,
  context: { provider: string; stage: string }
): T {
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
    return schema.parse(parsed);
  } catch (validationError) {
    console.error(`[LLM:${context.stage}] Schema validation failed`, parsed);
    throw new LLMServiceError('Response does not match expected schema', 'schema-validation', {
      provider: context.provider,
      stage: context.stage,
      error: validationError instanceof Error ? validationError.message : String(validationError),
    });
  }
}

export async function generateWeeklyProgram(input: LessonPlanInput): Promise<ValidatedWeeklyProgram> {
  const prompt = `Weekly theme: ${input.weeklyTheme}\nSubject area: ${input.subjectArea}\nGrade level: ${input.gradeLevel}\nLearner profile: ${input.learnerProfile ?? 'Not provided; assume mixed readiness with opportunities for choice.'}\nConstraints: ${input.constraints ?? 'None provided; keep materials lightweight and classroom-ready.'}`;

  const response = await generateText(prompt, WEEKLY_LESSON_SYSTEM_PROMPT, 'gpt-4o-mini', true);

  const structuredPlan: WeeklyProgram = parseWithSchema(response, WeeklyProgramSchema, {
    provider: 'openai',
    stage: 'weekly-plan',
  });

  const validated = validateWeeklyProgram(structuredPlan);
  if (validated.validation.blockingIssues.length > 0) {
    throw new LLMServiceError('Lesson plan failed pedagogy validation', 'schema-validation', {
      issues: validated.validation.blockingIssues,
    });
  }

  return validated;
}

export async function formatWeeklyMarkdown(program: ValidatedWeeklyProgram): Promise<string> {
  const prompt = JSON.stringify(program, null, 2);

  const response = await generateText(prompt, WEEKLY_MARKDOWN_FORMAT_PROMPT, 'gpt-4o-mini', false);
  return response.trim();
}

export function parseLessonPlanInput(body: unknown): LessonPlanInput {
  return LessonPlanInputSchema.parse(body);
}
