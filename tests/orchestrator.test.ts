import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateLinkedInCampaign } from '@/lib/orchestrator';
import type {
  CampaignInput,
  CampaignBlueprint,
  LinkedInPost,
  VideoScript,
  CampaignPostWithVideo,
} from '@/lib/schemas';

const makeBlueprint = (): CampaignBlueprint => ({
  campaignTitle: 'Demo Campaign: Escalar ventas B2B con IA',
  toneRecipe: 'Confianza en primera persona, ritmo rápido, storytelling con datos verificados.',
  hookPrinciples: ['Arranca con tensión', 'Usa números concretos', 'Cierra con comunidad'],
  angles: [1, 2, 3, 4, 5].map((id) => ({
    id,
    title: `Ángulo ${id}`,
    promise: `Promesa ${id}`,
    postType: id % 2 === 0 ? 'framework' : 'story',
    keyPoints: [`Idea ${id}-1`, `Idea ${id}-2`, `Idea ${id}-3`],
    whyItWorks: `Porque conecta con dolor ${id}.`,
  })),
});

const makePost = (angleId: number): LinkedInPost => ({
  angleId,
  angleTitle: `Ángulo ${angleId}`,
  headline: `Headline ${angleId}`,
  hook: `Hook ${angleId}`,
  copyMarkdown: `Hook ${angleId}\n\nCuerpo ${angleId}.`,
  keyTakeaway: `Insight ${angleId}`,
  callToAction: `CTA ${angleId}`,
  hashtags: ['growth', 'linkedin', `angle${angleId}`],
});

const makeVideoScript = (angleId: number): VideoScript => ({
  angleId,
  title: `Video ${angleId}`,
  hook: `Video hook ${angleId}`,
  duration: '0:55',
  beats: [1, 2, 3, 4, 5].map((order) => ({
    order,
    shot: `Shot ${order}`,
    voiceOver: `Voice ${order}`,
    onScreenText: order % 2 === 0 ? `Texto ${order}` : '',
    cameraDirection: 'Plano medio dinámico',
  })),
  closing: `Cierre ${angleId}`,
  callToAction: `CTA video ${angleId}`,
});

const fakeBlueprint = makeBlueprint();

vi.mock('@/lib/llm', () => ({
  generateCampaignBlueprint: vi.fn(async () => fakeBlueprint),
  generateLinkedInPostCopy: vi.fn(async (_blueprint: CampaignBlueprint, angleId: number) =>
    makePost(angleId)
  ),
  generateVideoScriptForPost: vi.fn(async (_blueprint: CampaignBlueprint, post: LinkedInPost) =>
    makeVideoScript(post.angleId)
  ),
  formatCampaignMarkdown: vi.fn(async ({ posts }: { posts: CampaignPostWithVideo[] }) => {
    return `# Demo Campaign\n\nTotal posts: ${posts.length}`;
  }),
}));

describe('generateLinkedInCampaign', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('ensambla la campaña y comunica el progreso por etapas', async () => {
    const input: CampaignInput = {
      mainTheme: 'Transformación digital con IA en empresas B2B',
      audienceProfile: 'CEOs de SaaS en crecimiento (Series A-B)',
      campaignGoal: 'Generar 30 demos calificadas en 30 días',
      brandVoice: 'Directo, basado en datos, cero humo',
      callToAction: 'Escríbeme «IA» y agendamos una sesión privada',
      offerDescription: 'Programa de aceleración comercial 1:1',
      contextNotes: 'Competimos contra consultoras tradicionales. Tenemos caso de éxito con FinTech X.',
    };

    const stages: Array<{ stage: string; status?: string; completed?: number }> = [];

    const campaign = await generateLinkedInCampaign(input, {
      onStage(stage, payload) {
        stages.push({
          stage,
          status: payload?.status as string | undefined,
          completed: payload?.completed as number | undefined,
        });
      },
    });

    expect(campaign.campaignTitle).toBe(fakeBlueprint.campaignTitle);
    expect(campaign.posts).toHaveLength(5);
    expect(campaign.posts[0].videoScript.beats.length).toBeGreaterThan(0);
    expect(campaign.markdown).toContain('Total posts: 5');
    expect(campaign.meta.mainTheme).toBe(input.mainTheme);
    expect(campaign.meta.callToAction).toBe(input.callToAction);

    const stageNames = stages.map((event) => event.stage);
    expect(stageNames.filter((name) => name === 'ideation')).toHaveLength(2);
    expect(stageNames.filter((name) => name === 'posts').length).toBeGreaterThanOrEqual(2);
    expect(stageNames.filter((name) => name === 'video').length).toBeGreaterThanOrEqual(2);
    expect(stageNames).toContain('format');

    expect(
      stages.find((event) => event.stage === 'posts' && event.status === 'completed')?.completed
    ).toBe(5);
    expect(
      stages.find((event) => event.stage === 'video' && event.status === 'completed')?.completed
    ).toBe(5);
  });
});
