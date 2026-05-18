import { getDbClient } from './client';

export type FolderKind = 'grupo' | 'materia' | 'custom';

export interface DbFolder {
  id: string;
  user_id: string;
  name: string;
  kind: FolderKind;
  color: string | null;
  created_at: string;
}

export interface FolderWithCount extends DbFolder {
  lessonCount: number;
}

export async function listFolders(userId: string): Promise<FolderWithCount[]> {
  const supabase = getDbClient();

  const foldersRes = await supabase
    .from('folders')
    .select('id, user_id, name, kind, color, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: true });
  if (foldersRes.error) throw foldersRes.error;

  const folders = (foldersRes.data ?? []) as DbFolder[];
  if (folders.length === 0) return [];

  // Counts por carpeta (un único query)
  const counts = await supabase
    .from('lessons')
    .select('folder_id, id')
    .eq('user_id', userId);
  if (counts.error) throw counts.error;

  const byFolder = new Map<string, number>();
  for (const row of counts.data ?? []) {
    const fid = (row as { folder_id: string | null }).folder_id;
    if (!fid) continue;
    byFolder.set(fid, (byFolder.get(fid) ?? 0) + 1);
  }

  return folders.map((f) => ({ ...f, lessonCount: byFolder.get(f.id) ?? 0 }));
}

export async function createFolder(args: {
  userId: string;
  name: string;
  kind?: FolderKind;
  color?: string | null;
}): Promise<DbFolder> {
  const supabase = getDbClient();
  const inserted = await supabase
    .from('folders')
    .insert({
      user_id: args.userId,
      name: args.name.trim().slice(0, 80),
      kind: args.kind ?? 'custom',
      color: args.color ?? null,
    })
    .select('id, user_id, name, kind, color, created_at')
    .single();
  if (inserted.error) throw inserted.error;
  return inserted.data as DbFolder;
}

export async function updateFolder(args: {
  userId: string;
  id: string;
  name?: string;
  color?: string | null;
}): Promise<DbFolder> {
  const supabase = getDbClient();
  const patch: Record<string, unknown> = {};
  if (typeof args.name === 'string') patch.name = args.name.trim().slice(0, 80);
  if (args.color !== undefined) patch.color = args.color;

  const updated = await supabase
    .from('folders')
    .update(patch)
    .eq('id', args.id)
    .eq('user_id', args.userId)
    .select('id, user_id, name, kind, color, created_at')
    .single();
  if (updated.error) throw updated.error;
  return updated.data as DbFolder;
}

export async function deleteFolder(args: { userId: string; id: string }): Promise<void> {
  const supabase = getDbClient();
  const res = await supabase
    .from('folders')
    .delete()
    .eq('id', args.id)
    .eq('user_id', args.userId);
  if (res.error) throw res.error;
}
