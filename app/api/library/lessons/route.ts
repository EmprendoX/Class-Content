import { NextRequest, NextResponse } from 'next/server';
import { requireLibraryUser } from '@/lib/db/guard';
import { listLessons, type LessonKind } from '@/lib/db/lessons';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const gate = await requireLibraryUser(request);
  if (!gate.ok) return gate.response;

  const url = new URL(request.url);
  const folderId = url.searchParams.get('folderId');
  const q = url.searchParams.get('q') ?? undefined;
  const favorite = url.searchParams.get('favorite') === '1';
  const kindParam = url.searchParams.get('kind');
  const allowed: LessonKind[] = ['quick', 'week', 'project', 'material'];
  const kind = allowed.includes(kindParam as LessonKind) ? (kindParam as LessonKind) : undefined;
  const limit = Number(url.searchParams.get('limit') ?? '50');
  const offset = Number(url.searchParams.get('offset') ?? '0');

  try {
    const result = await listLessons({
      userId: gate.user.id,
      folderId: folderId === 'unfiled' ? 'unfiled' : folderId || undefined,
      q,
      favorite,
      kind,
      limit: Number.isFinite(limit) ? limit : 50,
      offset: Number.isFinite(offset) ? offset : 0,
    });
    return NextResponse.json(result);
  } catch (err) {
    console.error(`[Library] ${gate.requestId} listLessons failed`, err);
    return NextResponse.json(
      { error: 'No se pudieron cargar las clases.', requestId: gate.requestId },
      { status: 500 }
    );
  }
}
