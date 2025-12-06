import { formatWeeklyMarkdown, generateClassMaterialsPackage, generateWeeklyProgram } from './llm';
import { markdownToHtml } from './markdown';
import type {
  ClassPackageResponse,
  ClassPlanRequest,
  LessonPlanInput,
  LessonProgramResponse,
  ValidatedClassPackage,
} from './schemas';

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

function formatClassPackageMarkdown(pkg: ValidatedClassPackage): string {
  const lines: string[] = [];

  lines.push(`# ${pkg.classTitle}`);
  lines.push(`Level: ${pkg.level} | Bloom level: ${pkg.bloomLevel}`);
  lines.push('');
  lines.push('## Overall objectives');
  pkg.overallObjectives.forEach((objective) => lines.push(`- ${objective}`));
  lines.push('');
  lines.push('## Consolidated view');
  lines.push(`**Overview:** ${pkg.consolidated.overview}`);
  lines.push(`**Publishing notes:** ${pkg.consolidated.publishingNotes}`);
  lines.push(`**Learner journey:** ${pkg.consolidated.learnerJourney}`);
  lines.push(`**QA checklist:** ${pkg.consolidated.qaChecklist}`);
  lines.push('');

  pkg.topics.forEach((topic, index) => {
    lines.push(`## Topic ${index + 1}: ${topic.topic}`);
    lines.push(`Template fit: ${topic.levelTemplate}`);
    lines.push(`Bloom target: ${topic.bloomTarget}`);
    lines.push('');
    lines.push('### Introduction');
    lines.push(topic.sections.introduction);
    lines.push('');
    lines.push('### Theory');
    lines.push(topic.sections.theory);
    lines.push('');
    lines.push('### Examples');
    topic.sections.examples.forEach((example) => lines.push(`- ${example}`));
    lines.push('');
    lines.push('### Exercises with solutions');
    topic.sections.exercises_with_solutions.forEach((exercise, idx) => {
      lines.push(`${idx + 1}. ${exercise.prompt} (Bloom: ${exercise.bloom_focus})`);
      lines.push(`   - Solution: ${exercise.solution}`);
    });
    lines.push('');
    lines.push('### Self-assessment');
    topic.sections.self_assessment.forEach((item) => lines.push(`- ${item}`));
    lines.push('');
    lines.push('### Resources');
    topic.sections.resources.forEach((resource) => lines.push(`- ${resource}`));
    lines.push('');
    lines.push('### Coverage and QA');
    lines.push(`- Objectives addressed: ${topic.coverage.objectivesAddressed.join('; ')}`);
    lines.push(`- Bloom alignment: ${topic.coverage.bloomAlignment}`);
    lines.push(`- Length check: ${topic.coverage.minimumLengthRationale}`);
    lines.push(
      `- Validation: ${topic.validation.issues.length === 0 ? 'All checks passed' : topic.validation.issues.join(' | ')}`
    );
    lines.push('');
    lines.push('### Sub-agent notes');
    lines.push(`- Conceptual: ${topic.subagentNotes.conceptual}`);
    lines.push(`- Examples: ${topic.subagentNotes.examples}`);
    lines.push(`- Exercises: ${topic.subagentNotes.exercises}`);
    lines.push(`- Resources: ${topic.subagentNotes.resources}`);
    lines.push(`- Pedagogical review: ${topic.subagentNotes.review}`);
    lines.push('');
  });

  return lines.join('\n');
}

export async function buildClassPackage(
  input: ClassPlanRequest,
  options?: { onStage?: (stage: GenerationStage, payload?: Record<string, unknown>) => void }
): Promise<ClassPackageResponse> {
  const onStage = options?.onStage;

  onStage?.('outline', { status: 'started' });
  const structured = await generateClassMaterialsPackage(input);
  onStage?.('outline', { status: 'completed', topics: structured.topics.length });

  onStage?.('validate', {
    status: structured.validation.blockingIssues.length ? 'failed' : 'completed',
    issues: structured.validation.blockingIssues,
  });

  if (structured.validation.blockingIssues.length) {
    throw new Error(structured.validation.blockingIssues.join(' | '));
  }

  onStage?.('format', { status: 'started' });
  const markdown = formatClassPackageMarkdown(structured);
  const html = markdownToHtml(markdown);
  onStage?.('format', { status: 'completed' });

  return {
    ...structured,
    markdown,
    html,
    meta: {
      level: input.level,
      bloomLevel: input.bloomLevel,
      constraints: input.constraints,
      generatedAt: new Date().toISOString(),
    },
  };
}
