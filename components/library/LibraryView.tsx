'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import Icon from '@/components/Icon';
import EmptyState from '@/components/EmptyState';
import type { FolderKind } from '@/lib/db/folders';
import type { LessonKind } from '@/lib/db/lessons';

interface FolderItem {
  id: string;
  name: string;
  kind: FolderKind;
  color: string | null;
  lessonCount: number;
}

interface LessonItem {
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

type ViewFilter = { type: 'all' } | { type: 'favorites' } | { type: 'unfiled' } | { type: 'folder'; id: string };

function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch {
    return iso;
  }
}

export default function LibraryView() {
  const [folders, setFolders] = useState<FolderItem[]>([]);
  const [lessons, setLessons] = useState<LessonItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<ViewFilter>({ type: 'all' });
  const [q, setQ] = useState('');
  const [debouncedQ, setDebouncedQ] = useState('');
  const [creatingFolder, setCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderKind, setNewFolderKind] = useState<FolderKind>('grupo');

  // debounce de búsqueda
  useEffect(() => {
    const id = setTimeout(() => setDebouncedQ(q.trim()), 300);
    return () => clearTimeout(id);
  }, [q]);

  const loadFolders = useCallback(async () => {
    const res = await fetch('/api/library/folders', { cache: 'no-store' });
    if (!res.ok) throw new Error('No se pudieron cargar las carpetas.');
    const data = await res.json();
    setFolders(data.items ?? []);
  }, []);

  const loadLessons = useCallback(async () => {
    const params = new URLSearchParams();
    if (filter.type === 'favorites') params.set('favorite', '1');
    if (filter.type === 'unfiled') params.set('folderId', 'unfiled');
    if (filter.type === 'folder') params.set('folderId', filter.id);
    if (debouncedQ) params.set('q', debouncedQ);
    const res = await fetch(`/api/library/lessons?${params.toString()}`, { cache: 'no-store' });
    if (!res.ok) throw new Error('No se pudieron cargar las clases.');
    const data = await res.json();
    setLessons(data.items ?? []);
  }, [filter, debouncedQ]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([loadFolders(), loadLessons()])
      .then(() => {
        if (!cancelled) setError(null);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Error');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [loadFolders, loadLessons]);

  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = newFolderName.trim();
    if (!name) return;
    const res = await fetch('/api/library/folders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, kind: newFolderKind }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      setError(err.error || 'No se pudo crear la carpeta.');
      return;
    }
    setNewFolderName('');
    setCreatingFolder(false);
    await loadFolders();
  };

  const handleDeleteFolder = async (id: string) => {
    if (!confirm('¿Eliminar carpeta? Las clases adentro NO se borran, quedan sin carpeta.')) return;
    const res = await fetch(`/api/library/folders/${id}`, { method: 'DELETE' });
    if (!res.ok) {
      setError('No se pudo eliminar.');
      return;
    }
    if (filter.type === 'folder' && filter.id === id) setFilter({ type: 'all' });
    await Promise.all([loadFolders(), loadLessons()]);
  };

  const handleToggleFavorite = async (lesson: LessonItem) => {
    setLessons((prev) =>
      prev.map((l) => (l.id === lesson.id ? { ...l, is_favorite: !l.is_favorite } : l))
    );
    const res = await fetch(`/api/library/lessons/${lesson.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isFavorite: !lesson.is_favorite }),
    });
    if (!res.ok) {
      setLessons((prev) =>
        prev.map((l) => (l.id === lesson.id ? { ...l, is_favorite: lesson.is_favorite } : l))
      );
    }
  };

  const handleDuplicate = async (lesson: LessonItem) => {
    const res = await fetch(`/api/library/lessons/${lesson.id}/duplicate`, { method: 'POST' });
    if (!res.ok) {
      setError('No se pudo duplicar.');
      return;
    }
    await loadLessons();
  };

  const handleDelete = async (lesson: LessonItem) => {
    if (!confirm(`¿Eliminar "${lesson.title}"? Esta acción no se puede deshacer.`)) return;
    const res = await fetch(`/api/library/lessons/${lesson.id}`, { method: 'DELETE' });
    if (!res.ok) {
      setError('No se pudo eliminar.');
      return;
    }
    await Promise.all([loadLessons(), loadFolders()]);
  };

  const handleMove = async (lesson: LessonItem, folderId: string | null) => {
    const res = await fetch(`/api/library/lessons/${lesson.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ folderId }),
    });
    if (!res.ok) {
      setError('No se pudo mover.');
      return;
    }
    await Promise.all([loadLessons(), loadFolders()]);
  };

  const totalLessons = useMemo(
    () => folders.reduce((acc, f) => acc + f.lessonCount, 0),
    [folders]
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[260px_minmax(0,1fr)] gap-6 lg:gap-8 items-start">
      {/* Sidebar */}
      <aside className="bg-white rounded-3xl shadow-soft border border-ink-100 p-5 lg:sticky lg:top-24">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display text-base font-bold text-ink-900">Carpetas</h2>
          <button
            type="button"
            onClick={() => setCreatingFolder((v) => !v)}
            className="text-xs font-semibold text-brand-700 hover:text-brand-800 inline-flex items-center gap-1"
          >
            <Icon name="sparkle" size={12} />
            Nueva
          </button>
        </div>

        {creatingFolder && (
          <form onSubmit={handleCreateFolder} className="mb-3 space-y-2 bg-ink-50/60 p-3 rounded-xl">
            <input
              type="text"
              autoFocus
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder="Ej. 3°A, Matemáticas, Secundaria 1"
              className="w-full px-3 py-2 text-sm border border-ink-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-200"
            />
            <select
              value={newFolderKind}
              onChange={(e) => setNewFolderKind(e.target.value as FolderKind)}
              className="w-full px-3 py-2 text-sm border border-ink-200 rounded-lg bg-white"
            >
              <option value="grupo">Grupo (ej. 3°A)</option>
              <option value="materia">Materia (ej. Matemáticas)</option>
              <option value="custom">Personalizada</option>
            </select>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={!newFolderName.trim()}
                className="flex-1 bg-brand-600 hover:bg-brand-700 disabled:bg-ink-300 text-white text-xs font-semibold py-2 rounded-lg"
              >
                Crear
              </button>
              <button
                type="button"
                onClick={() => {
                  setCreatingFolder(false);
                  setNewFolderName('');
                }}
                className="px-3 text-xs text-ink-600"
              >
                Cancelar
              </button>
            </div>
          </form>
        )}

        <ul className="space-y-1">
          <SidebarItem
            label="Todas"
            count={totalLessons}
            active={filter.type === 'all'}
            onClick={() => setFilter({ type: 'all' })}
            icon="sheet"
          />
          <SidebarItem
            label="Favoritos"
            count={lessons.filter((l) => l.is_favorite).length || undefined}
            active={filter.type === 'favorites'}
            onClick={() => setFilter({ type: 'favorites' })}
            icon="sparkle"
          />
          <SidebarItem
            label="Sin carpeta"
            active={filter.type === 'unfiled'}
            onClick={() => setFilter({ type: 'unfiled' })}
            icon="compass"
          />
          {folders.length > 0 && (
            <li className="pt-2 mt-2 border-t border-ink-100 text-[10px] uppercase tracking-wider text-ink-400 font-bold px-2">
              Tus carpetas
            </li>
          )}
          {folders.map((f) => (
            <SidebarItem
              key={f.id}
              label={f.name}
              count={f.lessonCount}
              active={filter.type === 'folder' && filter.id === f.id}
              onClick={() => setFilter({ type: 'folder', id: f.id })}
              onDelete={() => handleDeleteFolder(f.id)}
              icon={f.kind === 'grupo' ? 'users' : f.kind === 'materia' ? 'book' : 'compass'}
            />
          ))}
        </ul>
      </aside>

      {/* Main */}
      <section className="bg-white rounded-3xl shadow-soft border border-ink-100 overflow-hidden">
        <div className="px-6 py-5 border-b border-ink-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h2 className="font-display text-xl font-bold text-ink-900">
            {filter.type === 'favorites'
              ? 'Favoritos'
              : filter.type === 'unfiled'
              ? 'Clases sin carpeta'
              : filter.type === 'folder'
              ? folders.find((f) => f.id === filter.id)?.name || 'Carpeta'
              : 'Mis clases'}
          </h2>
          <div className="relative">
            <input
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar por título, materia o grado…"
              className="w-full sm:w-72 px-4 py-2 text-sm border border-ink-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-200"
            />
          </div>
        </div>

        <div className="p-6">
          {error && (
            <div className="mb-4 flex items-start gap-2 p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-sm">
              <Icon name="warning" size={16} className="flex-none mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-8 h-8 border-3 border-brand-200 border-t-brand-600 rounded-full animate-spin" />
            </div>
          ) : lessons.length === 0 ? (
            <EmptyState
              title={
                debouncedQ
                  ? 'Sin resultados'
                  : filter.type === 'favorites'
                  ? 'No tienes favoritos todavía'
                  : 'Aún no hay clases aquí'
              }
              description={
                debouncedQ
                  ? `No encontramos clases que coincidan con "${debouncedQ}". Probá con otro término.`
                  : 'Genera tu primera clase en la pestaña Crear y aparecerá automáticamente acá, lista para reusar.'
              }
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {lessons.map((lesson) => (
                <LessonCard
                  key={lesson.id}
                  lesson={lesson}
                  folders={folders}
                  onToggleFavorite={() => handleToggleFavorite(lesson)}
                  onDuplicate={() => handleDuplicate(lesson)}
                  onDelete={() => handleDelete(lesson)}
                  onMove={(fid) => handleMove(lesson, fid)}
                />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function SidebarItem({
  label,
  count,
  active,
  icon,
  onClick,
  onDelete,
}: {
  label: string;
  count?: number;
  active: boolean;
  icon: 'sheet' | 'sparkle' | 'compass' | 'users' | 'book';
  onClick: () => void;
  onDelete?: () => void;
}) {
  return (
    <li className="group">
      <button
        type="button"
        onClick={onClick}
        className={
          'w-full flex items-center justify-between gap-2 px-3 py-2 text-sm font-semibold rounded-lg transition-colors text-left ' +
          (active ? 'bg-brand-50 text-brand-800 border border-brand-100' : 'text-ink-700 hover:bg-ink-50')
        }
      >
        <span className="flex items-center gap-2 truncate">
          <Icon name={icon} size={14} />
          <span className="truncate">{label}</span>
        </span>
        <span className="flex items-center gap-2">
          {typeof count === 'number' && (
            <span className={'text-[11px] font-bold ' + (active ? 'text-brand-700' : 'text-ink-400')}>
              {count}
            </span>
          )}
          {onDelete && (
            <span
              role="button"
              tabIndex={0}
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.stopPropagation();
                  onDelete();
                }
              }}
              className="opacity-0 group-hover:opacity-100 text-ink-400 hover:text-rose-600 text-xs px-1"
              title="Eliminar carpeta"
            >
              ×
            </span>
          )}
        </span>
      </button>
    </li>
  );
}

function LessonCard({
  lesson,
  folders,
  onToggleFavorite,
  onDuplicate,
  onDelete,
  onMove,
}: {
  lesson: LessonItem;
  folders: FolderItem[];
  onToggleFavorite: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onMove: (folderId: string | null) => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="bg-white border border-ink-100 rounded-2xl p-4 hover:shadow-soft hover:border-brand-200 transition-all flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <Link href={`/mis-clases/${lesson.id}`} className="flex-1 min-w-0">
          <h3 className="font-semibold text-ink-900 leading-tight line-clamp-2 hover:text-brand-700 transition-colors">
            {lesson.title}
          </h3>
        </Link>
        <button
          type="button"
          onClick={onToggleFavorite}
          className={
            'flex-none text-lg leading-none ' +
            (lesson.is_favorite ? 'text-amber-500' : 'text-ink-300 hover:text-amber-500')
          }
          title={lesson.is_favorite ? 'Quitar de favoritos' : 'Marcar como favorito'}
        >
          {lesson.is_favorite ? '★' : '☆'}
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-xs text-ink-500">
        {lesson.subject && (
          <span className="inline-flex items-center gap-1 bg-brand-50 text-brand-700 border border-brand-100 px-2 py-0.5 rounded-full font-semibold">
            <Icon name="book" size={11} />
            {lesson.subject}
          </span>
        )}
        {lesson.grade && (
          <span className="inline-flex items-center gap-1 bg-accent-50 text-accent-700 border border-accent-100 px-2 py-0.5 rounded-full font-semibold">
            <Icon name="users" size={11} />
            {lesson.grade}
          </span>
        )}
        {lesson.duration_min && (
          <span className="inline-flex items-center gap-1 text-ink-600">
            <Icon name="clock" size={11} />
            {lesson.duration_min} min
          </span>
        )}
      </div>

      <div className="flex items-center justify-between gap-2 pt-2 border-t border-ink-100">
        <span className="text-[11px] text-ink-400">{formatDate(lesson.created_at)}</span>
        <div className="relative">
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            className="text-xs font-semibold text-ink-600 hover:text-ink-900 px-2 py-1"
          >
            Acciones ▾
          </button>
          {menuOpen && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setMenuOpen(false)}
                aria-hidden
              />
              <div className="absolute right-0 bottom-full mb-1 z-20 w-56 bg-white border border-ink-200 rounded-xl shadow-pop py-1 text-sm">
                <Link
                  href={`/mis-clases/${lesson.id}`}
                  className="block w-full text-left px-3 py-2 hover:bg-ink-50 text-ink-800"
                >
                  Abrir
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    onDuplicate();
                  }}
                  className="block w-full text-left px-3 py-2 hover:bg-ink-50 text-ink-800"
                >
                  Duplicar
                </button>
                <div className="border-t border-ink-100 my-1" />
                <div className="px-3 py-1 text-[10px] uppercase tracking-wider text-ink-400 font-bold">
                  Mover a
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    onMove(null);
                  }}
                  className="block w-full text-left px-3 py-2 hover:bg-ink-50 text-ink-700"
                >
                  Sin carpeta
                </button>
                {folders.map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      onMove(f.id);
                    }}
                    className={
                      'block w-full text-left px-3 py-2 hover:bg-ink-50 ' +
                      (lesson.folder_id === f.id ? 'text-brand-700 font-semibold' : 'text-ink-700')
                    }
                  >
                    {f.name}
                  </button>
                ))}
                <div className="border-t border-ink-100 my-1" />
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    onDelete();
                  }}
                  className="block w-full text-left px-3 py-2 hover:bg-rose-50 text-rose-700"
                >
                  Eliminar
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
