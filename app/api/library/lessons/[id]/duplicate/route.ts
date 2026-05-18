import { NextRequest, NextResponse } from 'next/server';
import { requireLibraryUser } from '@/lib/db/guard';
import { duplicateLesson } from '@/lib/db/lessons';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const gate = await requireLibraryUser(request);
  if (!gate.ok) return gate.response;

  try {
    const copy = await duplicateLesson({ userId: gate.user.id, id: params.id });
    return NextResponse.json(copy);
  } catch (err) {
    console.error(`[Library] ${gate.requestId} duplicate failed`, err);
    return NextResponse.json({ error: 'No se pudo duplicar.' }, { status: 500 });
  }
}
