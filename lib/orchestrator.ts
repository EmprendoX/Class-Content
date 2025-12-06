import {
  generateCampaignBlueprint,
  generateLinkedInPostCopy,
  generateVideoScriptForPost,
  formatCampaignMarkdown,
} from './llm';
import { markdownToHtml } from './markdown';
import type {
  CampaignInput,
  LinkedInCampaignOutput,
  CampaignBlueprint,
  CampaignPostWithVideo,
  LinkedInPost,
} from './schemas';

export type GenerationStage = 'ideation' | 'posts' | 'video' | 'format';

export async function generateLinkedInCampaign(
  input: CampaignInput,
  options?: {
    onStage?: (stage: GenerationStage, payload?: Record<string, unknown>) => void;
  }
): Promise<LinkedInCampaignOutput> {
  const onStage = options?.onStage;
  onStage?.('ideation', { status: 'started' });

  const blueprint: CampaignBlueprint = await generateCampaignBlueprint(input);

  onStage?.('ideation', {
    status: 'completed',
    angles: blueprint.angles.length,
    campaignTitle: blueprint.campaignTitle,
  });

  onStage?.('posts', {
    status: 'started',
    completed: 0,
    total: blueprint.angles.length,
  });

  const postCopies: LinkedInPost[] = [];
  let postsCompleted = 0;

  for (const angle of blueprint.angles) {
    const postCopy = await generateLinkedInPostCopy(blueprint, angle.id, input);

    postCopies.push(postCopy);
    postsCompleted += 1;

    onStage?.('posts', {
      status: 'progress',
      completed: postsCompleted,
      total: blueprint.angles.length,
      angleId: angle.id,
    });
  }

  onStage?.('posts', {
    status: 'completed',
    completed: blueprint.angles.length,
    total: blueprint.angles.length,
  });

  onStage?.('video', {
    status: 'started',
    completed: 0,
    total: postCopies.length,
  });

  const postsWithVideo: CampaignPostWithVideo[] = [];
  let videosCompleted = 0;

  for (const post of postCopies) {
    const videoScript = await generateVideoScriptForPost(blueprint, post, input);

    postsWithVideo.push({
      ...post,
      videoScript,
    });

    videosCompleted += 1;

    onStage?.('video', {
      status: 'progress',
      completed: videosCompleted,
      total: postCopies.length,
      angleId: post.angleId,
    });
  }

  onStage?.('video', {
    status: 'completed',
    completed: postCopies.length,
    total: postCopies.length,
  });

  onStage?.('format', { status: 'started' });

  const formattedMarkdown = await formatCampaignMarkdown({
    blueprint,
    posts: postsWithVideo,
    input,
  });

  const html = markdownToHtml(formattedMarkdown);

  onStage?.('format', { status: 'completed' });

  return {
    campaignTitle: blueprint.campaignTitle,
    toneRecipe: blueprint.toneRecipe,
    hookPrinciples: blueprint.hookPrinciples,
    angles: blueprint.angles,
    posts: postsWithVideo,
    markdown: formattedMarkdown,
    html,
    meta: {
      mainTheme: input.mainTheme,
      audienceProfile: input.audienceProfile,
      campaignGoal: input.campaignGoal,
      brandVoice: input.brandVoice,
      callToAction: input.callToAction,
      offerDescription: input.offerDescription,
      contextNotes: input.contextNotes,
      generatedAt: new Date().toISOString(),
    },
  };
}