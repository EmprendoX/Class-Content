import { z } from 'zod';

const trimValue = <T>(schema: z.ZodType<T>) =>
  z.preprocess((val) => (typeof val === 'string' ? val.trim() : val), schema);

const optionalTrimmedString = z.preprocess(
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

const requiredTrimmedString = trimValue(z.string().min(1));

export const CampaignInputSchema = z.object({
  mainTheme: requiredTrimmedString,
  audienceProfile: requiredTrimmedString,
  campaignGoal: requiredTrimmedString,
  brandVoice: optionalTrimmedString,
  callToAction: optionalTrimmedString,
  offerDescription: optionalTrimmedString,
  contextNotes: optionalTrimmedString,
});

export type CampaignInput = z.infer<typeof CampaignInputSchema>;

export const CampaignAngleSchema = z.object({
  id: z.number().int().min(1),
  title: trimValue(z.string().min(1)),
  promise: trimValue(z.string().min(1)),
  postType: trimValue(z.string().min(1)),
  keyPoints: z.array(trimValue(z.string().min(1))).min(2),
  whyItWorks: trimValue(z.string().min(1)),
});

export type CampaignAngle = z.infer<typeof CampaignAngleSchema>;

export const CampaignBlueprintSchema = z.object({
  campaignTitle: trimValue(z.string().min(1)),
  toneRecipe: trimValue(z.string().min(1)),
  hookPrinciples: z.array(trimValue(z.string().min(1))).min(1),
  angles: z.array(CampaignAngleSchema).length(5, {
    message: 'Se requieren exactamente 5 ángulos para la campaña.',
  }),
});

export type CampaignBlueprint = z.infer<typeof CampaignBlueprintSchema>;

export const LinkedInPostSchema = z.object({
  angleId: z.number().int().min(1),
  angleTitle: trimValue(z.string().min(1)),
  headline: trimValue(z.string().min(1)),
  hook: trimValue(z.string().min(1)),
  copyMarkdown: trimValue(z.string().min(1)),
  keyTakeaway: trimValue(z.string().min(1)),
  callToAction: trimValue(z.string().min(1)),
  hashtags: z.array(trimValue(z.string().min(1))).min(1).max(6),
});

export type LinkedInPost = z.infer<typeof LinkedInPostSchema>;

export const VideoBeatSchema = z.object({
  order: z.number().int().min(1),
  shot: trimValue(z.string().min(1)),
  voiceOver: trimValue(z.string().min(1)),
  onScreenText: optionalTrimmedString.default(''),
  cameraDirection: trimValue(z.string().min(1)),
});

export type VideoBeat = z.infer<typeof VideoBeatSchema>;

export const VideoScriptSchema = z.object({
  angleId: z.number().int().min(1),
  title: trimValue(z.string().min(1)),
  hook: trimValue(z.string().min(1)),
  duration: trimValue(z.string().min(1)),
  beats: z.array(VideoBeatSchema).min(3),
  closing: trimValue(z.string().min(1)),
  callToAction: trimValue(z.string().min(1)),
});

export type VideoScript = z.infer<typeof VideoScriptSchema>;

export const CampaignPostWithVideoSchema = LinkedInPostSchema.extend({
  videoScript: VideoScriptSchema,
});

export type CampaignPostWithVideo = z.infer<typeof CampaignPostWithVideoSchema>;

export const LinkedInCampaignOutputSchema = z.object({
  campaignTitle: trimValue(z.string().min(1)),
  toneRecipe: trimValue(z.string().min(1)),
  hookPrinciples: z.array(trimValue(z.string().min(1))),
  angles: z.array(CampaignAngleSchema),
  posts: z.array(CampaignPostWithVideoSchema),
  markdown: z.string(),
  html: z.string(),
  meta: z.object({
    mainTheme: z.string(),
    audienceProfile: z.string(),
    campaignGoal: z.string(),
    brandVoice: z.string().optional(),
    callToAction: z.string().optional(),
    offerDescription: z.string().optional(),
    contextNotes: z.string().optional(),
    generatedAt: z.string(),
  }),
});

export type LinkedInCampaignOutput = z.infer<typeof LinkedInCampaignOutputSchema>;

