import { NextRequest, NextResponse } from 'next/server';
import { requireLibraryUser } from '@/lib/db/guard';
import { deleteLesson, getLesson, updateLesson, type UpdateLessonPatch } from '@/lib/db/lessons';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const gate = await requireLibraryUser(request);
  if (!gate.ok) return gate.response;

  try {
    const lesson = await getLesson({ userId: gate.user.id, id: params.id });
    if (!lesson) {
      return NextResponse.json({ error: 'No encontrada.' }, { status: 404 });
    }
    return NextResponse.json(lesson);
  } catch (err) {
    console.error(`[Library] ${gate.requestId} getLesson failed`, err);
    return NextResponse.json({ error: 'No se pudo cargar.' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const gate = await requireLibraryUser(request);
  if (!gate.ok) return gate.response;

  let body: Partial<UpdateLessonPatch> & { folderId?: string | null };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'JSON inválido.' }, { status: 400 });
  }

  const patch: UpdateLessonPatch = {};
  if (typeof body.title === 'string') patch.title = body.title;
  if (body.folderId !== undefined) patch.folderId = body.folderId;
  if (typeof body.isFavorite === 'boolean') patch.isFavorite = body.isFavorite;

  try {
    const updated = await updateLesson({ userId: gate.user.id, id: params.id, patch });
    return NextResponse.json(updated);
  } catch (err) {
    console.error(`[Library] ${gate.requestId} updateLesson failed`, err);
    return NextResponse.json({ error: 'No se pudo actualizar.' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const gate = await requireLibraryUser(request);
  if (!gate.ok) return gate.response;

  try {
    await deleteLesson({ userId: gate.user.id, id: params.id });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(`[Library] ${gate.requestId} deleteLesson failed`, err);
    return NextResponse.json({ error: 'No se pudo eliminar.' }, { status: 500 });
  }
}
