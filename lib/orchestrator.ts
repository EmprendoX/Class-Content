import { formatWeeklyMarkdown, generateWeeklyProgram } from './llm';
import { markdownToHtml } from './markdown';
import type { LessonPlanInput, LessonProgramResponse } from './schemas';

export type GenerationStage = 'outline' | 'validate' | 'format' | null;

export async function buildWeeklyLessonProgram(
  input: LessonPlanInput,
  options?: {
    onStage?: (stage: GenerationStage, payload?: Record<string, unknown>) => void;
  }
): Promise<LessonProgramResponse> {
  const onStage = options?.onStage;

  onStage?.('outline', { status: 'started' });
  const structured = await generateWeeklyProgram(input);
  onStage?.('outline', { status: 'completed', lessons: structured.lessons.length });

  onStage?.('validate', {
    status: structured.validation.blockingIssues.length ? 'failed' : 'completed',
    issues: structured.validation.blockingIssues,
  });

  if (structured.validation.blockingIssues.length) {
    throw new Error(structured.validation.blockingIssues.join(' | '));
  }

  onStage?.('format', { status: 'started' });
  const markdown = await formatWeeklyMarkdown(structured);
  const html = markdownToHtml(markdown);
  onStage?.('format', { status: 'completed' });

  return {
    ...structured,
    markdown,
    html,
    meta: {
      subjectArea: input.subjectArea,
      gradeLevel: input.gradeLevel,
      learnerProfile: input.learnerProfile,
      constraints: input.constraints,
      generatedAt: new Date().toISOString(),
    },
  };
}
