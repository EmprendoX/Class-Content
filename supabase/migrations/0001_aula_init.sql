-- Aula — migración inicial.
-- Target: proyecto Supabase dedicado para Aula (DB nueva, sin otras apps).
-- Schema = public (proyecto aislado). RLS desactivado en MVP: acceso solo
-- vía service role desde server. Ownership se valida en lib/db.

-- Usuarios identificados por email (viene del JWT sub).
CREATE TABLE IF NOT EXISTS public.users (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email       text UNIQUE NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- Carpetas (grupos, materias, custom).
CREATE TABLE IF NOT EXISTS public.folders (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name        text NOT NULL,
  kind        text NOT NULL DEFAULT 'custom' CHECK (kind IN ('grupo','materia','custom')),
  color       text,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_folders_user ON public.folders(user_id);

-- Lecciones. `kind` deja lugar para week/project/material en fases siguientes.
CREATE TABLE IF NOT EXISTS public.lessons (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id            uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  folder_id          uuid REFERENCES public.folders(id) ON DELETE SET NULL,
  kind               text NOT NULL DEFAULT 'quick' CHECK (kind IN ('quick','week','project','material')),
  title              text NOT NULL,
  subject            text,
  grade              text,
  duration_min       integer,
  tone               text,
  language           text,
  payload            jsonb NOT NULL,
  markdown           text,
  is_favorite        boolean NOT NULL DEFAULT false,
  parent_lesson_id   uuid REFERENCES public.lessons(id) ON DELETE SET NULL,
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_lessons_user_created  ON public.lessons(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_lessons_user_folder   ON public.lessons(user_id, folder_id);
CREATE INDEX IF NOT EXISTS idx_lessons_user_favorite ON public.lessons(user_id, is_favorite) WHERE is_favorite = true;

-- Trigger para updated_at.
CREATE OR REPLACE FUNCTION public.set_updated_at() RETURNS trigger AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_lessons_updated_at ON public.lessons;
CREATE TRIGGER trg_lessons_updated_at
BEFORE UPDATE ON public.lessons
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- RLS off en MVP. La ownership se valida en server.
ALTER TABLE public.users    DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.folders  DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons  DISABLE ROW LEVEL SECURITY;
