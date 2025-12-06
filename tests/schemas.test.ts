import { describe, it, expect } from 'vitest';
import {
  CampaignInputSchema,
  CampaignBlueprintSchema,
  LinkedInPostSchema,
  VideoScriptSchema,
} from '@/lib/schemas';

describe('CampaignInputSchema', () => {
  it('recorta campos opcionales y permite dejar vacíos', () => {
    const result = CampaignInputSchema.parse({
      mainTheme: '  IA aplicada en ventas  ',
      audienceProfile: '  Fundadores de SaaS  ',
      campaignGoal: '  Abrir 20 demos  ',
      brandVoice: '  ',
      callToAction: '',
      offerDescription: '  ',
      contextNotes: 'Casos de éxito en Latam',
    });

    expect(result.mainTheme).toBe('IA aplicada en ventas');
    expect(result.brandVoice).toBeUndefined();
    expect(result.callToAction).toBeUndefined();
    expect(result.offerDescription).toBeUndefined();
    expect(result.contextNotes).toBe('Casos de éxito en Latam');
  });

  it('rechaza faltantes obligatorios', () => {
    expect(() =>
      CampaignInputSchema.parse({
        mainTheme: '',
        audienceProfile: '',
        campaignGoal: '',
      })
    ).toThrow();
  });
});

describe('Campaign blueprint schema', () => {
  it('valida que existan exactamente 5 ángulos', () => {
    expect(() =>
      CampaignBlueprintSchema.parse({
        campaignTitle: 'Demo',
        toneRecipe: 'Directo',
        hookPrinciples: ['Gancho'],
        angles: [
          {
            id: 1,
            title: 'Uno',
            promise: 'Promesa',
            postType: 'story',
            keyPoints: ['A', 'B', 'C'],
            whyItWorks: 'Porque sí',
          },
        ],
      })
    ).toThrow();
  });
});

describe('LinkedInPostSchema', () => {
  it('limita hashtags y mantiene el markdown del post', () => {
    const post = LinkedInPostSchema.parse({
      angleId: 1,
      angleTitle: 'Ángulo',
      headline: 'Headline',
      hook: 'Hook',
      copyMarkdown: 'Hook\n\nCuerpo',
      keyTakeaway: 'Insight',
      callToAction: 'CTA',
      hashtags: ['uno', 'dos', 'tres'],
    });

    expect(post.hashtags).toHaveLength(3);
    expect(post.copyMarkdown).toContain('Cuerpo');
  });
});

describe('VideoScriptSchema', () => {
  it('requiere al menos tres beats', () => {
    expect(() =>
      VideoScriptSchema.parse({
        angleId: 1,
        title: 'Video',
        hook: 'Hook',
        duration: '0:45',
        beats: [
          {
            order: 1,
            shot: 'Shot',
            voiceOver: 'VO',
            onScreenText: '',
            cameraDirection: 'Plano medio',
          },
        ],
        closing: 'Cierre',
        callToAction: 'CTA',
      })
    ).toThrow();
  });
});
