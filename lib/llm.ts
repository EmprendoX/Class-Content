import OpenAI from 'openai';
import type { ZodSchema } from 'zod';
import {
  CampaignBlueprint,
  CampaignBlueprintSchema,
  CampaignInput,
  LinkedInPost,
  LinkedInPostSchema,
  VideoScript,
  VideoScriptSchema,
} from './schemas';
import {
  CAMPAIGN_FORMATTER_PROMPT,
  CAMPAIGN_IDEATOR_PROMPT,
  LINKEDIN_POST_PROMPT,
  VIDEO_SCRIPT_PROMPT,
} from './prompts';

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

export async function generateCampaignBlueprint(
  input: CampaignInput
): Promise<CampaignBlueprint> {
  const prompt = `Tema central de la campaña: ${input.mainTheme}
Objetivo estratégico: ${input.campaignGoal}
Perfil de audiencia: ${input.audienceProfile}
Voz de marca deseada: ${input.brandVoice ?? 'No especificada; define una voz humana, directa y profesional.'}
CTA obligatorio: ${input.callToAction ?? 'Debe cerrar invitando a conversar, comentar o escribir al autor.'}
Oferta o producto a destacar: ${input.offerDescription ?? 'No hay oferta específica, enfócate en aportar valor y posicionar autoridad.'}
Notas contextuales: ${input.contextNotes ?? 'Sin notas adicionales.'}

Entrega cinco ángulos únicos y accionables para una campaña de LinkedIn.`;

  const response = await generateText(
    prompt,
    CAMPAIGN_IDEATOR_PROMPT,
    'gpt-4o-mini',
    true
  );

  return parseWithSchema(response, CampaignBlueprintSchema, {
    provider: 'openai',
    stage: 'campaign-blueprint',
  });
}

export async function generateLinkedInPostCopy(
  blueprint: CampaignBlueprint,
  angleId: number,
  input: CampaignInput
): Promise<LinkedInPost> {
  const angle = blueprint.angles.find((item) => item.id === angleId);
  if (!angle) {
    throw new LLMServiceError(`Angle ${angleId} not found in blueprint`, 'invalid-json', {
      stage: 'post-copy',
    });
  }

  const prompt = `Tema central: ${input.mainTheme}
Objetivo: ${input.campaignGoal}
Audiencia: ${input.audienceProfile}
Receta de tono: ${blueprint.toneRecipe}
Principios de hook: ${blueprint.hookPrinciples.join(' | ')}

Ángulo asignado (id ${angle.id}):
- Título: ${angle.title}
- Promesa: ${angle.promise}
- Tipo de post: ${angle.postType}
- Por qué funciona: ${angle.whyItWorks}
- Puntos clave:
${angle.keyPoints.map((point, index) => `  ${index + 1}. ${point}`).join('\n')}

CTA deseado: ${input.callToAction ?? 'Invita a comentar, compartir y establecer contacto directo.'}
Oferta/producto: ${input.offerDescription ?? 'No hay venta directa; demuestra autoridad y valor práctico.'}

Redacta el post completo siguiendo la estructura solicitada.`;

  const response = await generateText(
    prompt,
    LINKEDIN_POST_PROMPT,
    'gpt-4o-mini',
    true
  );

  return parseWithSchema(response, LinkedInPostSchema, {
    provider: 'openai',
    stage: 'post-copy',
  });
}

export async function generateVideoScriptForPost(
  blueprint: CampaignBlueprint,
  post: LinkedInPost,
  input: CampaignInput
): Promise<VideoScript> {
  const angle = blueprint.angles.find((item) => item.id === post.angleId);
  const prompt = `Transforma el siguiente post viral de LinkedIn en un guion de video vertical.

Tema central: ${input.mainTheme}
Ángulo: ${angle ? angle.title : post.angleTitle}
Promesa del ángulo: ${angle ? angle.promise : 'Usa la misma promesa del post.'}
Tono deseado: ${blueprint.toneRecipe}
Objetivo de campaña: ${input.campaignGoal}
CTA preferido: ${post.callToAction}

Hook del post: ${post.hook}
Headline: ${post.headline}
Copy completo:
${post.copyMarkdown}

Entrega el guion respetando la estructura solicitada.`;

  const response = await generateText(
    prompt,
    VIDEO_SCRIPT_PROMPT,
    'gpt-4o-mini',
    true
  );

  return parseWithSchema(response, VideoScriptSchema, {
    provider: 'openai',
    stage: 'video-script',
  });
}

export async function formatCampaignMarkdown(payload: {
  blueprint: CampaignBlueprint;
  posts: Array<LinkedInPost & { videoScript: VideoScript }>;
  input: CampaignInput;
}): Promise<string> {
  const summaryBlock = {
    theme: payload.input.mainTheme,
    goal: payload.input.campaignGoal,
    audience: payload.input.audienceProfile,
    tone: payload.blueprint.toneRecipe,
    hooks: payload.blueprint.hookPrinciples,
  };

  const postBlocks = payload.posts.map((post, index) => ({
    order: index + 1,
    angleId: post.angleId,
    angleTitle: post.angleTitle,
    headline: post.headline,
    hook: post.hook,
    copyMarkdown: post.copyMarkdown,
    callToAction: post.callToAction,
    hashtags: post.hashtags,
    keyTakeaway: post.keyTakeaway,
    videoScript: post.videoScript,
  }));

  const prompt = `Resumen ejecutivo:
${JSON.stringify(summaryBlock, null, 2)}

Posts listos:
${JSON.stringify(postBlocks, null, 2)}

Genera el Markdown final siguiendo exactamente la guía.`;

  const response = await generateText(
    prompt,
    CAMPAIGN_FORMATTER_PROMPT,
    'gpt-4o-mini',
    false
  );

  return response.trim();
}

