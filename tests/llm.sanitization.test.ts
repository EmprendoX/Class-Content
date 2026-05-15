import { describe, it, expect } from 'vitest';
import { WeeklyProgramSchema, LessonPlanInputSchema } from '@/lib/schemas';

const basePedagogyFlags = {
  montessori: { choice: true, hands_on: true, prepared_environment: true, self_correction: true },
  constructivist: { link_to_prior_knowledge: true, guided_discovery: true, social_interaction: true, peer_collaboration: true },
  critical: { open_questions: true, evidence_based_claims: true, peer_discussion: true },
};

const baseMontessoriElements = {
  prepared_environment: 'Estaciones con bandejas etiquetadas',
  manipulatives: 'Kit con texturas y escalas variadas',
  choice: 'Los alumnos eligen dos de tres estaciones',
  self_correction: 'Tarjetas de auto-corrección en cada estación',
};

const makeLesson = (title: string) => ({
  title,
  objectives: ['Identificar patrones', 'Construir afirmaciones con evidencia'],
  materials: ['Cuaderno de bitácora', 'Kit de ciencias'],
  activities: {
    prior_knowledge: 'Los estudiantes recuerdan experimentos previos con plantas.',
    exploration: 'Pequeños grupos construyen terrarios con elección de materiales.',
    concept_building: 'El facilitador guía un modelo compartido con evidencia.',
    reflection: 'Los alumnos se auto-corrigen y comparten conclusiones.',
  },
  montessori: baseMontessoriElements,
  critical_questions: [
    '¿Cómo cambia la evidencia tu afirmación?',
    '¿Qué patrones observás?',
    '¿Dónde ves espacio para la auto-corrección?',
  ],
  assessment: 'Notas de observación y ticket de salida.',
  duration: '55 minutos',
  age_range: '9 a 11 años',
  pedagogy_flags: basePedagogyFlags,
});

describe('Spanish content preservation', () => {
  it('keeps accents and ñ intact through input validation', () => {
    const result = LessonPlanInputSchema.parse({
      weeklyTheme: 'Energía y materia',
      subjectArea: 'Matemáticas',
      gradeLevel: '4° primaria — niños de 9 a 10 años',
      learnerProfile: 'Grupo con motivación alta y curiosidad por la ciencia',
      constraints: 'Materiales económicos disponibles en el aula',
    });

    expect(result.weeklyTheme).toBe('Energía y materia');
    expect(result.subjectArea).toBe('Matemáticas');
    expect(result.gradeLevel).toContain('niños');
  });

  it('passes weekly program schema validation with Spanish lessons', () => {
    const weeklyProgram = {
      weeklyTheme: 'Energía y movimiento',
      overview: 'Los aprendices exploran el movimiento con investigaciones prácticas.',
      template: {
        lesson: 'Objetivos, materiales, fases constructivistas, preguntas, evaluación, checklists',
        lesson_schema: makeLesson('Lección plantilla'),
        weekly_template: ['Clase 1', 'Clase 2', 'Clase 3', 'Clase 4', 'Clase 5'],
        reference_week: {
          theme: 'Exploración de ecosistemas',
          lessons: [
            makeLesson('Referencia 1'),
            makeLesson('Referencia 2'),
            makeLesson('Referencia 3'),
            makeLesson('Referencia 4'),
            makeLesson('Referencia 5'),
          ],
        },
      },
      lessons: [
        makeLesson('Lección 1'),
        makeLesson('Lección 2'),
        makeLesson('Lección 3'),
        makeLesson('Lección 4'),
        makeLesson('Lección 5'),
      ],
    };

    const parsed = WeeklyProgramSchema.parse(weeklyProgram);

    expect(parsed.weeklyTheme).toBe('Energía y movimiento');
    expect(parsed.lessons[0].critical_questions[0]).toContain('evidencia');
    expect(parsed.lessons[0].title).toBe('Lección 1');
  });
});
