import { describe, it, expect } from 'vitest';
import {
  SingleLessonInputSchema,
  SingleLessonSchema,
  validateSingleLesson,
  type SingleLesson,
} from '@/lib/schemas';

const basePedagogyFlags = {
  montessori: { choice: true, hands_on: true, prepared_environment: true, self_correction: true },
  constructivist: {
    link_to_prior_knowledge: true,
    guided_discovery: true,
    social_interaction: true,
    peer_collaboration: true,
  },
  critical: { open_questions: true, evidence_based_claims: true, peer_discussion: true },
};

const longExplanation =
  'Las fracciones equivalentes representan la misma cantidad pero con diferentes números. ' +
  'Por ejemplo, si cortamos una pizza al medio, cada mitad es 1/2 de la pizza. ' +
  'Si cortamos esa misma pizza en cuatro partes iguales, dos de esas partes son 2/4 de la pizza. ' +
  'Ambas representaciones, 1/2 y 2/4, muestran exactamente la misma cantidad de pizza. ' +
  'Esto pasa porque al multiplicar el numerador y el denominador por el mismo número, la fracción mantiene su valor.';

const longScript =
  'Empezá diciendo en voz alta: "Hoy vamos a descubrir algo sorprendente sobre las pizzas y las fracciones. ' +
  'Si yo corto una pizza al medio y como una mitad, ¿qué fracción comí?". Esperá las respuestas (5-7 segundos). ' +
  'Los alumnos van a responder "un medio" o "1/2". Confirmá y escribí en el pizarrón: 1/2. ' +
  'Ahora seguí: "Pero, ¿qué pasa si corto la misma pizza en cuatro partes iguales? ¿Cuántas partes tengo que comer para tener la misma cantidad?". Dales 10 segundos para pensar en parejas.';

const makeLesson = (overrides: Partial<SingleLesson> = {}): SingleLesson => ({
  title: 'Fracciones equivalentes',
  subtitle: 'Una introducción visual',
  meta: { duration_min: 45, grade_level: '4° primaria', subject: 'Matemáticas' },
  overview: {
    learning_goal: 'Identificar y construir fracciones equivalentes usando representaciones visuales',
    why_it_matters: 'Les permite resolver problemas cotidianos de medidas y comparaciones',
    prerequisites: ['Reconocer fracciones simples como 1/2, 1/3, 1/4'],
  },
  core_content: {
    main_explanation: longExplanation,
    key_concepts: [
      {
        name: 'Fracción equivalente',
        definition: 'Dos fracciones que representan la misma cantidad',
        why_it_matters: 'Es la base para sumar y restar fracciones',
      },
      {
        name: 'Multiplicación equivalente',
        definition: 'Multiplicar numerador y denominador por el mismo número',
        why_it_matters: 'Es la regla para generar fracciones equivalentes',
      },
    ],
    vocabulary: [
      { term: 'Numerador', definition: 'Número de arriba en la fracción', example_in_context: 'En 3/4, el numerador es 3' },
      { term: 'Denominador', definition: 'Número de abajo', example_in_context: 'En 3/4, el denominador es 4' },
    ],
    analogies: [{ analogy: 'Cortar la pizza en más o menos pedazos', what_it_illustrates: 'La cantidad total no cambia' }],
  },
  phases: [
    {
      name: 'Apertura',
      duration_min: 10,
      teacher_script: longScript,
      student_actions: 'Responden preguntas, levantan la mano',
      materials_used: ['pizarrón', 'tiza'],
      transitions: 'Pasamos a la exploración con los materiales',
    },
    {
      name: 'Exploración',
      duration_min: 20,
      teacher_script: longScript,
      student_actions: 'Trabajan en parejas con tarjetas de fracciones',
      materials_used: ['tarjetas', 'hoja en blanco'],
      transitions: 'Volvemos al pleno para compartir hallazgos',
    },
    {
      name: 'Cierre',
      duration_min: 15,
      teacher_script: longScript,
      student_actions: 'Completan el ticket de salida',
      materials_used: ['ticket impreso'],
      transitions: 'Despedida y recogen materiales',
    },
  ],
  worked_examples: [
    {
      example: 'Mostrar que 1/2 = 2/4',
      solution_steps: ['Dibujar dos rectángulos del mismo tamaño', 'Dividir uno en 2 partes iguales y sombrear 1', 'Dividir el otro en 4 partes iguales y sombrear 2', 'Comparar visualmente'],
      common_mistakes: ['Pensar que 2/4 es más porque tiene números mayores'],
      teacher_note: 'Hacer la comparación visual antes de la regla algebraica',
    },
    {
      example: 'Encontrar una fracción equivalente a 1/3',
      solution_steps: ['Multiplicar numerador y denominador por 2', 'Obtenemos 2/6'],
      common_mistakes: ['Multiplicar solo el numerador'],
      teacher_note: 'Insistir en la regla: el mismo número arriba y abajo',
    },
  ],
  common_misconceptions: [
    {
      misconception: '2/4 es más que 1/2 porque tiene números mayores',
      correction: 'Los números son mayores pero representan partes más chicas; al multiplicarse compensan',
      diagnostic_question: '¿Qué es mayor, 1/2 o 2/4?',
    },
    {
      misconception: 'Se puede sumar numeradores y denominadores entre fracciones',
      correction: '1/2 + 1/2 no es 2/4. Primero hay que igualar denominadores',
      diagnostic_question: '¿Cuánto es 1/2 + 1/2?',
    },
  ],
  dialogue_prompts: [
    {
      question: '¿Por qué creés que 1/2 y 2/4 son iguales?',
      expected_responses: ['Porque ocupan la misma parte de la pizza', 'Porque al sombrear se ve igual'],
      teacher_follow_up: 'Confirmar y conectar con la regla algebraica',
    },
    {
      question: '¿Podrías darme otra fracción equivalente a 1/2?',
      expected_responses: ['3/6', '4/8', '5/10'],
      teacher_follow_up: 'Pedir que muestren cómo llegaron',
    },
    {
      question: '¿Qué pasa si multiplicamos solo el numerador?',
      expected_responses: ['Cambia el valor', 'No es equivalente'],
      teacher_follow_up: 'Reforzar la regla',
    },
  ],
  worksheet: {
    instructions: 'Resolvé los siguientes problemas y mostrá tu razonamiento',
    problems: [
      { number: 1, prompt: 'Escribí dos fracciones equivalentes a 1/3', answer: '2/6 y 3/9', difficulty: 'easy' },
      { number: 2, prompt: 'Escribí dos fracciones equivalentes a 2/5', answer: '4/10 y 6/15', difficulty: 'easy' },
      { number: 3, prompt: '¿Es 3/4 equivalente a 6/8? Justificá', answer: 'Sí, porque 3×2/4×2 = 6/8', difficulty: 'medium' },
      { number: 4, prompt: 'Encontrá una fracción equivalente a 5/6 con denominador 12', answer: '10/12', difficulty: 'medium' },
      { number: 5, prompt: 'Si tengo 1/4 de pizza y mi amigo tiene 2/8, ¿quién tiene más?', answer: 'Tienen lo mismo', difficulty: 'hard' },
    ],
  },
  exit_ticket: {
    questions: [
      { prompt: '¿Es 4/6 equivalente a 2/3?', answer: 'Sí, porque 2×2/3×2 = 4/6' },
      { prompt: 'Escribí una fracción equivalente a 1/2 con denominador 10', answer: '5/10' },
    ],
    grading_rubric: 'Proficiente: ambas correctas con justificación. Desarrollando: una correcta. Inicial: ninguna.',
  },
  differentiation: {
    for_struggling: 'Usar fichas físicas y representaciones visuales antes de la regla algebraica',
    for_advanced: 'Pedirles que encuentren patrones y los expliquen con álgebra',
    accommodations: 'Para alumnos con dislexia, usar colores diferentes para numerador y denominador',
  },
  extension: {
    homework: {
      description: 'Encontrar tres fracciones equivalentes a 3/5 y representarlas con dibujos',
      expected_time_min: 20,
    },
    parent_note: 'Estimadas familias: hoy aprendimos sobre fracciones equivalentes. Pueden practicar dividiendo una pizza o un chocolate de distintas formas.',
    follow_up_lesson_idea: 'Suma de fracciones con denominadores iguales',
  },
  pedagogy_flags: basePedagogyFlags,
  ...overrides,
});

describe('SingleLessonInputSchema', () => {
  it('applies default values for language, tone, userType, classDuration', () => {
    const parsed = SingleLessonInputSchema.parse({
      topic: 'Fracciones equivalentes',
      subjectArea: 'Matemáticas',
      gradeLevel: '4° primaria',
    });
    expect(parsed.language).toBe('es');
    expect(parsed.tone).toBe('conversacional');
    expect(parsed.userType).toBe('maestro');
    expect(parsed.classDuration).toBe('45');
  });

  it('accepts Spanish accents and ñ', () => {
    const parsed = SingleLessonInputSchema.parse({
      topic: 'La fotosíntesis y la energía',
      subjectArea: 'Ciencias naturales',
      gradeLevel: 'Niños de 1° primaria',
      learningObjective: 'Que los alumnos comprendan la conversión de energía solar',
    });
    expect(parsed.topic).toBe('La fotosíntesis y la energía');
    expect(parsed.gradeLevel).toContain('Niños');
  });

  it('rejects unknown enum values', () => {
    expect(() =>
      SingleLessonInputSchema.parse({
        topic: 't',
        subjectArea: 's',
        gradeLevel: 'g',
        tone: 'aggressive',
      })
    ).toThrow();
  });

  it('accepts optional sourceMaterial and sourceFilename', () => {
    const longText = 'palabra '.repeat(500);
    const parsed = SingleLessonInputSchema.parse({
      topic: 'Fracciones',
      subjectArea: 'Matemáticas',
      gradeLevel: '4° primaria',
      sourceMaterial: longText,
      sourceFilename: 'capitulo-4.pdf',
    });
    expect(parsed.sourceMaterial).toContain('palabra');
    expect(parsed.sourceFilename).toBe('capitulo-4.pdf');
  });

  it('leaves sourceMaterial undefined when not provided', () => {
    const parsed = SingleLessonInputSchema.parse({
      topic: 't',
      subjectArea: 's',
      gradeLevel: 'g',
    });
    expect(parsed.sourceMaterial).toBeUndefined();
    expect(parsed.sourceFilename).toBeUndefined();
  });
});

describe('SingleLessonSchema + validateSingleLesson', () => {
  it('parses a full valid lesson', () => {
    const parsed = SingleLessonSchema.parse(makeLesson());
    expect(parsed.title).toBe('Fracciones equivalentes');
    expect(parsed.phases).toHaveLength(3);
    expect(parsed.worksheet.problems).toHaveLength(5);
  });

  it('flags durations that do not sum to the requested total', () => {
    const lesson = makeLesson();
    const result = validateSingleLesson(lesson, 60);
    expect(result.durationsMatch).toBe(false);
    expect(result.issues.some((i) => i.includes('Phase durations'))).toBe(true);
  });

  it('passes when phase durations sum to the expected total (with 10% tolerance)', () => {
    const lesson = makeLesson();
    const result = validateSingleLesson(lesson, 45);
    expect(result.durationsMatch).toBe(true);
  });

  it('flags a short main_explanation', () => {
    const lesson = makeLesson({
      core_content: {
        ...makeLesson().core_content,
        main_explanation: 'Demasiado corto.',
      },
    });
    const result = validateSingleLesson(lesson, 45);
    expect(result.explanationDepthOk).toBe(false);
  });

  it('flags a short teacher_script', () => {
    const baseLesson = makeLesson();
    const lesson = makeLesson({
      phases: [
        { ...baseLesson.phases[0], teacher_script: 'Decí algo.' },
        baseLesson.phases[1],
        baseLesson.phases[2],
      ],
    });
    const result = validateSingleLesson(lesson, 45);
    expect(result.scriptDepthOk).toBe(false);
  });

  it('flags an undersized worksheet', () => {
    const baseLesson = makeLesson();
    const lesson = makeLesson({
      worksheet: {
        instructions: baseLesson.worksheet.instructions,
        problems: baseLesson.worksheet.problems.slice(0, 3),
      },
    });
    // The schema itself enforces min(5) — the worksheet validator won't even run.
    expect(() => SingleLessonSchema.parse(lesson)).toThrow();
  });

  it('flags incomplete pedagogy flags', () => {
    const lesson = makeLesson({
      pedagogy_flags: {
        ...basePedagogyFlags,
        montessori: { ...basePedagogyFlags.montessori, hands_on: false },
      },
    });
    const result = validateSingleLesson(lesson, 45);
    expect(result.montessoriComplete).toBe(false);
  });
});
