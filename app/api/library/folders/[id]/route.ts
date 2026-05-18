import { NextRequest, NextResponse } from 'next/server';
import { requireLibraryUser } from '@/lib/db/guard';
import { deleteFolder, updateFolder } from '@/lib/db/folders';

export const dynamic = 'force-dynamic';

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const gate = await requireLibraryUser(request);
  if (!gate.ok) return gate.response;

  let body: { name?: unknown; color?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'JSON inválido.' }, { status: 400 });
  }

  const patch: { name?: string; color?: string | null } = {};
  if (typeof body.name === 'string') patch.name = body.name;
  if (body.color === null || typeof body.color === 'string') patch.color = body.color;

  try {
    const folder = await updateFolder({ userId: gate.user.id, id: params.id, ...patch });
    return NextResponse.json(folder);
  } catch (err) {
    console.error(`[Library] ${gate.requestId} updateFolder failed`, err);
    return NextResponse.json({ error: 'No se pudo actualizar.' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const gate = await requireLibraryUser(request);
  if (!gate.ok) return gate.response;

  try {
    await deleteFolder({ userId: gate.user.id, id: params.id });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(`[Library] ${gate.requestId} deleteFolder failed`, err);
    return NextResponse.json({ error: 'No se pudo eliminar.' }, { status: 500 });
  }
}
