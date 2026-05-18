import { NextRequest, NextResponse } from 'next/server';
import { requireLibraryUser } from '@/lib/db/guard';
import { createFolder, listFolders, type FolderKind } from '@/lib/db/folders';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const gate = await requireLibraryUser(request);
  if (!gate.ok) return gate.response;

  try {
    const items = await listFolders(gate.user.id);
    return NextResponse.json({ items });
  } catch (err) {
    console.error(`[Library] ${gate.requestId} listFolders failed`, err);
    return NextResponse.json({ error: 'No se pudieron cargar las carpetas.' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const gate = await requireLibraryUser(request);
  if (!gate.ok) return gate.response;

  let body: { name?: unknown; kind?: unknown; color?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'JSON inválido.' }, { status: 400 });
  }

  const name = typeof body.name === 'string' ? body.name.trim() : '';
  if (!name) return NextResponse.json({ error: 'El nombre es requerido.' }, { status: 400 });

  const allowed: FolderKind[] = ['grupo', 'materia', 'custom'];
  const kind = allowed.includes(body.kind as FolderKind) ? (body.kind as FolderKind) : 'custom';
  const color = typeof body.color === 'string' ? body.color : null;

  try {
    const folder = await createFolder({ userId: gate.user.id, name, kind, color });
    return NextResponse.json(folder, { status: 201 });
  } catch (err) {
    console.error(`[Library] ${gate.requestId} createFolder failed`, err);
    return NextResponse.json({ error: 'No se pudo crear la carpeta.' }, { status: 500 });
  }
}
