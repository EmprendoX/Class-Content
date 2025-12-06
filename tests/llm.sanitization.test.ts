import { describe, it, expect } from 'vitest';
import { sanitizeEnglishContent } from '@/lib/llm';
import { WeeklyProgramSchema } from '@/lib/schemas';

const basePedagogyFlags = {
  montessori: { choice: true, hands_on: true, prepared_environment: true, self_correction: true },
  constructivist: { link_to_prior_knowledge: true, guided_discovery: true, social_interaction: true, peer_collaboration: true },
  critical: { open_questions: true, evidence_based_claims: true, peer_discussion: true },
};

const baseMontessoriElements = {
  prepared_environment: 'Shelf stations with labeled trays',
  manipulatives: 'Hands-on kit with varied textures and scales',
  choice: 'Learners pick two of three stations',
  self_correction: 'Self-check cards at each station',
};

const makeLesson = (title: string) => ({
  title,
  objectives: ['Identify patterns', 'Build evidence-based claims'],
  materials: ['Journal', 'Science kit'],
  activities: {
    prior_knowledge: 'Students recall prior experiments with plants.',
    exploration: 'Small groups build terrariums with learner choice of materials.',
    concept_building: 'Facilitator guíes a shared model with evidence notes.',
    reflection: 'Learners self-correct using a checklist and share takeaways.',
  },
  montessori: baseMontessoriElements,
  critical_questions: [
    'How does evidencía change your claim?',
    'What patterns do you observe?',
    'Where do you see room for self-correction?',
  ],
  assessment: 'Observation notes plus a quick exit ticket.',
  duration: '55 minutes',
  age_range: 'Ages 9-11',
  pedagogy_flags: basePedagogyFlags,
});

describe('sanitizeEnglishContent', () => {
  it('removes diacritics before schema validation runs', () => {
    const weeklyProgramWithAccents = {
      weeklyTheme: 'Energía and Motion',
      overview: 'Learners explore motion with hands-on investigación.',
      template: {
        lesson: 'Objectives, materials, constructivist phases, critical questions, assessment, checklists',
        lesson_schema: makeLesson('Template lesson'),
        weekly_template: ['Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5'],
        reference_week: {
          theme: 'Exploración de Ecosistemas',
          lessons: [
            makeLesson('Reference 1'),
            makeLesson('Reference 2'),
            makeLesson('Reference 3'),
            makeLesson('Reference 4'),
            makeLesson('Reference 5'),
          ],
        },
      },
      lessons: [
        makeLesson('Lesson 1'),
        makeLesson('Lesson 2'),
        makeLesson('Lesson 3'),
        {
          ...makeLesson('Lesson 4'),
          activities: {
            ...makeLesson('Lesson 4').activities,
            concept_building: 'Peer revisión y reflexión rápida',
          },
        },
        makeLesson('Lesson 5'),
      ],
    };

    const sanitized = sanitizeEnglishContent(weeklyProgramWithAccents);

    expect(sanitized.lessons[1].critical_questions[0]).toBe('How does evidencia change your claim?');
    expect(sanitized.lessons[3].activities.concept_building).toBe('Peer revision y reflexion rapida');
    expect(() => WeeklyProgramSchema.parse(sanitized)).not.toThrow();
  });
});
