import { getDbClient } from './client';
import type { SingleLessonResponse } from '@/lib/schemas';

export type LessonKind = 'quick' | 'week' | 'project' | 'material';

export interface DbLessonRow {
  id: string;
  user_id: string;
  folder_id: string | null;
  kind: LessonKind;
  title: string;
  subject: string | null;
  grade: string | null;
  duration_min: number | null;
  tone: string | null;
  language: string | null;
  payload: SingleLessonResponse;
  markdown: string | null;
  is_favorite: boolean;
  parent_lesson_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface LessonSummary {
  id: string;
  folder_id: string | null;
  kind: LessonKind;
  title: string;
  subject: string | null;
  grade: string | null;
  duration_min: number | null;
  language: string | null;
  is_favorite: boolean;
  parent_lesson_id: string | null;
  created_at: string;
  updated_at: string;
}

const SUMMARY_COLUMNS =
  'id, folder_id, kind, title, subject, grade, duration_min, language, is_favorite, parent_lesson_id, created_at, updated_at';

export async function saveLesson(args: {
  userId: string;
  lesson: SingleLessonResponse;
  kind?: LessonKind;
  folderId?: string | null;
  parentLessonId?: string | null;
}): Promise<DbLessonRow> {
  const supabase = getDbClient();
  const l = args.lesson;

  const inserted = await supabase
    .from('lessons')
    .insert({
      user_id: args.userId,
      folder_id: args.folderId ?? null,
      kind: args.kind ?? 'quick',
      title: l.title?.slice(0, 240) || 'Clase sin título',
      subject: l.meta?.subject ?? null,
      grade: l.meta?.gradeLevel ?? l.meta?.grade_level ?? null,
      duration_min: l.meta?.duration_min ?? null,
      tone: l.meta?.tone ?? null,
      language: l.meta?.language ?? null,
      payload: l,
      markdown: l.markdown ?? null,
      parent_lesson_id: args.parentLessonId ?? null,
    })
    .select('*')
    .single();
  if (inserted.error) throw inserted.error;
  return inserted.data as DbLessonRow;
}

export interface ListLessonsArgs {
  userId: string;
  folderId?: string | 'unfiled' | null;
  q?: string;
  favorite?: boolean;
  kind?: LessonKind;
  limit?: number;
  offset?: number;
}

export interface ListLessonsResult {
  items: LessonSummary[];
  total: number;
}

export async function listLessons(args: ListLessonsArgs): Promise<ListLessonsResult> {
  const supabase = getDbClient();
  const limit = Math.min(Math.max(args.limit ?? 50, 1), 100);
  const offset = Math.max(args.offset ?? 0, 0);

  let query = supabase
    .from('lessons')
    .select(SUMMARY_COLUMNS, { count: 'exact' })
    .eq('user_id', args.userId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (args.folderId === 'unfiled') {
    query = query.is('folder_id', null);
  } else if (args.folderId) {
    query = query.eq('folder_id', args.folderId);
  }

  if (args.favorite) query = query.eq('is_favorite', true);
  if (args.kind) query = query.eq('kind', args.kind);

  if (args.q && args.q.trim()) {
    const term = args.q.trim().replace(/[%_,]/g, ' ');
    const pattern = `%${term}%`;
    query = query.or(`title.ilike.${pattern},subject.ilike.${pattern},grade.ilike.${pattern}`);
  }

  const res = await query;
  if (res.error) throw res.error;

  return {
    items: (res.data ?? []) as LessonSummary[],
    total: res.count ?? 0,
  };
}

export async function getLesson(args: {
  userId: string;
  id: string;
}): Promise<DbLessonRow | null> {
  const supabase = getDbClient();
  const res = await supabase
    .from('lessons')
    .select('*')
    .eq('id', args.id)
    .eq('user_id', args.userId)
    .maybeSingle();
  if (res.error) throw res.error;
  return (res.data as DbLessonRow | null) ?? null;
}

export interface UpdateLessonPatch {
  title?: string;
  folderId?: string | null;
  isFavorite?: boolean;
  payload?: SingleLessonResponse;
  markdown?: string;
}

export async function updateLesson(args: {
  userId: string;
  id: string;
  patch: UpdateLessonPatch;
}): Promise<DbLessonRow> {
  const supabase = getDbClient();
  const update: Record<string, unknown> = {};
  if (typeof args.patch.title === 'string') update.title = args.patch.title.slice(0, 240);
  if (args.patch.folderId !== undefined) update.folder_id = args.patch.folderId;
  if (typeof args.patch.isFavorite === 'boolean') update.is_favorite = args.patch.isFavorite;
  if (args.patch.payload) {
    update.payload = args.patch.payload;
    const m = args.patch.payload.meta;
    if (m) {
      update.subject = m.subject ?? null;
      update.grade = m.gradeLevel ?? m.grade_level ?? null;
      update.duration_min = m.duration_min ?? null;
      update.tone = m.tone ?? null;
      update.language = m.language ?? null;
    }
    if (args.patch.payload.title) update.title = args.patch.payload.title.slice(0, 240);
  }
  if (typeof args.patch.markdown === 'string') update.markdown = args.patch.markdown;

  const res = await supabase
    .from('lessons')
    .update(update)
    .eq('id', args.id)
    .eq('user_id', args.userId)
    .select('*')
    .single();
  if (res.error) throw res.error;
  return res.data as DbLessonRow;
}

export async function deleteLesson(args: { userId: string; id: string }): Promise<void> {
  const supabase = getDbClient();
  const res = await supabase
    .from('lessons')
    .delete()
    .eq('id', args.id)
    .eq('user_id', args.userId);
  if (res.error) throw res.error;
}

export async function duplicateLesson(args: {
  userId: string;
  id: string;
}): Promise<DbLessonRow> {
  const original = await getLesson({ userId: args.userId, id: args.id });
  if (!original) throw new Error('Clase no encontrada');

  const supabase = getDbClient();
  const inserted = await supabase
    .from('lessons')
    .insert({
      user_id: original.user_id,
      folder_id: original.folder_id,
      kind: original.kind,
      title: `${original.title} (copia)`.slice(0, 240),
      subject: original.subject,
      grade: original.grade,
      duration_min: original.duration_min,
      tone: original.tone,
      language: original.language,
      payload: original.payload,
      markdown: original.markdown,
      parent_lesson_id: original.id,
    })
    .select('*')
    .single();
  if (inserted.error) throw inserted.error;
  return inserted.data as DbLessonRow;
}
