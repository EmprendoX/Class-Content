import { describe, it, expect, vi, beforeEach } from 'vitest';
import { buildSingleLesson } from '@/lib/orchestrator';
import type { SingleLessonInput, ValidatedSingleLesson } from '@/lib/schemas';

const baseValidation = {
  durationsMatch: true,
  explanationDepthOk: true,
  scriptDepthOk: true,
  worksheetSizeOk: true,
  montessoriComplete: true,
  constructivistComplete: true,
  criticalThinkingComplete: true,
  issues: [],
};

const fakeLesson: ValidatedSingleLesson = {
  title: 'Fracciones equivalentes',
  meta: { duration_min: 45, grade_level: '4° primaria', subject: 'Matemáticas' },
  overview: {
    learning_goal: 'Identificar fracciones equivalentes',
    why_it_matters: 'Base para sumar fracciones',
    prerequisites: ['Saber fracciones simples'],
  },
  core_content: {
    main_explanation: 'Explicación detallada de cómo dos fracciones pueden tener distinta forma y el mismo valor.',
    key_concepts: [
      { name: 'Equivalencia', definition: 'Mismo valor', why_it_matters: 'Resuelve comparaciones' },
      { name: 'Multiplicar arriba y abajo', definition: 'Regla', why_it_matters: 'Genera equivalentes' },
    ],
    vocabulary: [
      { term: 'Numerador', definition: 'Arriba', example_in_context: 'En 3/4 es 3' },
      { term: 'Denominador', definition: 'Abajo', example_in_context: 'En 3/4 es 4' },
    ],
    analogies: [{ analogy: 'Pizza', what_it_illustrates: 'La misma cantidad cortada distinto' }],
  },
  phases: [
    {
      name: 'Apertura',
      duration_min: 10,
      teacher_script: 'Decí: "Hoy descubriremos algo sobre las pizzas".',
      student_actions: 'Responden',
      materials_used: ['pizarrón'],
      transitions: 'Pasamos a exploración',
    },
    {
      name: 'Exploración',
      duration_min: 20,
      teacher_script: 'Trabajen en parejas con las tarjetas.',
      student_actions: 'Trabajan',
      materials_used: ['tarjetas'],
      transitions: 'Volvemos al pleno',
    },
    {
      name: 'Cierre',
      duration_min: 15,
      teacher_script: 'Completen el ticket.',
      student_actions: 'Escriben',
      materials_used: ['ticket'],
      transitions: 'Despedida',
    },
  ],
  worked_examples: [
    {
      example: '1/2 = 2/4',
      solution_steps: ['Dibujar', 'Comparar'],
      common_mistakes: ['Pensar que 2/4 es mayor'],
      teacher_note: 'Empezar visual',
    },
    {
      example: '1/3 = 2/6',
      solution_steps: ['Multiplicar por 2', 'Verificar'],
      common_mistakes: ['Solo el numerador'],
      teacher_note: 'Insistir en la regla',
    },
  ],
  common_misconceptions: [
    {
      misconception: '2/4 es mayor que 1/2',
      correction: 'Tienen la misma área pintada',
      diagnostic_question: '¿Qué es mayor, 1/2 o 2/4?',
    },
    {
      misconception: 'Se suman numeradores y denominadores',
      correction: 'Primero igualar denominadores',
      diagnostic_question: '¿Cuánto es 1/2 + 1/2?',
    },
  ],
  dialogue_prompts: [
    {
      question: '¿Por qué son iguales?',
      expected_responses: ['Misma área', 'Visualmente igual'],
      teacher_follow_up: 'Conectar con la regla',
    },
    {
      question: '¿Otra equivalente a 1/2?',
      expected_responses: ['3/6', '4/8'],
      teacher_follow_up: 'Pedir justificación',
    },
    {
      question: '¿Y si multiplico solo arriba?',
      expected_responses: ['Cambia', 'No equivalente'],
      teacher_follow_up: 'Reforzar regla',
    },
  ],
  worksheet: {
    instructions: 'Resolvé y justificá',
    problems: [
      { number: 1, prompt: 'Equivalentes a 1/3', answer: '2/6, 3/9', difficulty: 'easy' },
      { number: 2, prompt: 'Equivalentes a 2/5', answer: '4/10, 6/15', difficulty: 'easy' },
      { number: 3, prompt: '¿3/4 = 6/8?', answer: 'Sí', difficulty: 'medium' },
      { number: 4, prompt: 'Equivalente a 5/6 con denom 12', answer: '10/12', difficulty: 'medium' },
      { number: 5, prompt: '1/4 vs 2/8', answer: 'Igual', difficulty: 'hard' },
    ],
  },
  exit_ticket: {
    questions: [
      { prompt: '¿4/6 = 2/3?', answer: 'Sí' },
      { prompt: 'Equivalente a 1/2 con denom 10', answer: '5/10' },
    ],
    grading_rubric: 'Proficiente, desarrollando, inicial',
  },
  differentiation: {
    for_struggling: 'Usar fichas físicas',
    for_advanced: 'Pedir patrón algebraico',
    accommodations: 'Colores distintos',
  },
  extension: {
    homework: { description: 'Tres equivalentes a 3/5', expected_time_min: 20 },
    parent_note: 'Practiquen con la pizza',
    follow_up_lesson_idea: 'Suma de fracciones',
  },
  pedagogy_flags: {
    montessori: { choice: true, hands_on: true, prepared_environment: true, self_correction: true },
    constructivist: {
      link_to_prior_knowledge: true,
      guided_discovery: true,
      social_interaction: true,
      peer_collaboration: true,
    },
    critical: { open_questions: true, evidence_based_claims: true, peer_discussion: true },
  },
  validation: baseValidation,
};

vi.mock('@/lib/llm', () => ({
  generateSingleLesson: vi.fn(async () => fakeLesson),
}));

describe('buildSingleLesson', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('builds the lesson, attaches meta and markdown, emits stages', async () => {
    const input: SingleLessonInput = {
      topic: 'Fracciones equivalentes',
      subjectArea: 'Matemáticas',
      gradeLevel: '4° primaria',
      language: 'es',
      tone: 'ludico',
      userType: 'maestro',
      classDuration: '45',
    };

    const stages: Array<{ stage: string; status?: string }> = [];

    const result = await buildSingleLesson(input, {
      onStage: (stage, payload) => {
        const entry: { stage: string; status?: string } = { stage: stage ?? '' };
        if (payload && typeof payload === 'object' && 'status' in payload) {
          const s = (payload as { status?: unknown }).status;
          if (typeof s === 'string') entry.status = s;
        }
        stages.push(entry);
      },
    });

    expect(result.title).toBe('Fracciones equivalentes');
    expect(result.meta.topic).toBe('Fracciones equivalentes');
    expect(result.meta.language).toBe('es');
    expect(result.meta.tone).toBe('ludico');
    expect(result.meta.classDuration).toBe('45');
    expect(result.markdown).toContain('# Fracciones equivalentes');
    expect(result.markdown).toContain('## Vista general');
    expect(result.markdown).toContain('Guión por fases');
    expect(result.html).toContain('<h1');

    const stageOrder = stages.map((entry) => entry.stage);
    expect(stageOrder).toEqual(['outline', 'outline', 'validate', 'format', 'format']);
  });
});
