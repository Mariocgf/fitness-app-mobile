/**
 * DTOs del módulo Foro / Comunidad (tab "Comunidad").
 * Mapean 1:1 el contrato del backend: docs/forum/frontend-integration.md.
 *
 * OJO con las 3 reglas de oro del contrato:
 *  1. `flags` advierte, no bendice: lista vacía NO es "aprobado" (nunca un badge verde).
 *  2. El feed trae el `body` COMPLETO (truncar en la card, no hay excerpt).
 *  3. Los ERRORES vienen en PascalCase (`StatusCode`/`Message`/`FlaggedTerms`); los éxitos en camelCase.
 */

/** Respuesta paginada genérica del foro (feed y comentarios comparten forma). */
export interface PagedResponse<T> {
  page: number;
  pageSize: number;
  totalCount: number;
  items: T[];
}

/* ── Enums (viajan como string) ───────────────────────────────────────────── */

/** Cómo se expresan las repeticiones de un ejercicio del snapshot. */
export type ForumRepType = 'Fixed' | 'Range' | 'Timed';

/** Tipo de carga del ejercicio del snapshot. */
export type ForumLoadType = 'BodyWeight' | 'ExternalWeight';

/** Tipo de advertencia sobre la rutina adjunta. */
export type ForumFlagKind = 'Injury' | 'Equipment';

/* ── Feed ─────────────────────────────────────────────────────────────────── */

/**
 * Item del feed (`GET /api/forum/posts`). El `body` viene COMPLETO: truncar en la card.
 * `authorName` puede venir VACÍO si el autor eliminó su cuenta → placeholder "Usuario eliminado".
 * `attachedRoutineVersionId` presente (≠ null) → el post tiene rutina adjunta (mostrar "Ver rutina").
 */
export interface ForumPostSummary {
  id: string;
  authorId: string;
  authorName: string;
  title: string;
  body: string;
  attachedRoutineVersionId: string | null;
  likeCount: number;
  likedByMe: boolean;
  commentCount: number;
  createdAt: string;
}

/* ── Mis publicaciones ────────────────────────────────────────────────────── */

/**
 * Item de "Mis publicaciones" (`GET /api/forum/me/posts`). NO es el mismo DTO que el feed:
 *  - Sin datos de autor (el autor sos vos) ni `likedByMe` (no aporta en tu propia pantalla).
 *  - CON `isHidden`: los posts ocultados por moderación vienen igual, para que puedas
 *    distinguir "me lo ocultaron" (reversible desde el panel) de "se borró".
 * El `body` viene COMPLETO, igual que el feed: truncar en la card (regla de oro #2).
 */
export interface MyForumPostSummary {
  id: string;
  title: string;
  body: string;
  attachedRoutineVersionId: string | null;
  likeCount: number;
  commentCount: number;
  isHidden: boolean;
  createdAt: string;
}

/* ── Detalle ──────────────────────────────────────────────────────────────── */

/** Ejercicio dentro de un día del snapshot de rutina adjunta. */
export interface ForumRoutineExercise {
  exerciseId: string;
  name: string;
  gifUrl: string | null;
  order: number;
  sets: number;
  repType: ForumRepType;
  minRep: number | null;
  maxRep: number | null;
  durationSeconds: number | null;
  rest: number | null;
  loadType: ForumLoadType;
  plannedWeightKg: number | null;
  primaryMuscleGroup: string | null;
}

/** Día del snapshot de rutina adjunta. */
export interface ForumRoutineDay {
  dayOfWeek: string;
  approxTimeSession: number;
  exercises: ForumRoutineExercise[];
}

/** Snapshot de la rutina adjunta a un post (read-only, no es la rutina editable de Fitness). */
export interface ForumAttachedRoutine {
  versionId: string;
  days: ForumRoutineDay[];
}

/**
 * Advertencia sobre la rutina adjunta. Es ESTRUCTURA, no frase: el texto lo arma el front.
 *  - `kind: 'Injury'`    → `subject` es la lesión del lector (ej. "Hombro").
 *  - `kind: 'Equipment'` → `subject` es el equipo que le falta (ej. "barbell").
 *  - `affectedExerciseIds` → ids que matchean con `exercise.exerciseId` → resaltar esos ejercicios.
 * REGLA DE ORO #1: `flags: []` → NO mostrar nada (ni un verde). Silencio, no aprobación.
 */
export interface ForumFlag {
  kind: ForumFlagKind;
  subject: string;
  affectedExerciseIds: string[];
}

/**
 * Detalle del post (`GET /api/forum/posts/{id}`).
 * `attachedRoutine` = null si el post es solo texto (o la rutina ya no existe).
 */
export interface ForumPostDetail {
  id: string;
  authorId: string;
  authorName: string;
  title: string;
  body: string;
  createdAt: string;
  commentCount: number;
  attachedRoutine: ForumAttachedRoutine | null;
  flags: ForumFlag[];
}

/* ── Comentarios ──────────────────────────────────────────────────────────── */

/** Comentario plano (sin anidar). `authorName` puede venir vacío (autor eliminado). */
export interface ForumComment {
  id: string;
  authorId: string;
  authorName: string;
  body: string;
  createdAt: string;
}

/* ── Payloads ─────────────────────────────────────────────────────────────── */

/** Body de `POST /api/forum/posts`. `attachedRoutineVersionId` opcional (null = solo texto). */
export interface CreatePostRequest {
  title: string;
  body: string;
  attachedRoutineVersionId?: string | null;
}

/** Body de `POST /api/forum/posts/{id}/comments`. */
export interface CreateCommentRequest {
  body: string;
}

/** Body opcional de los endpoints de denuncia (`.../report`). */
export interface ReportRequest {
  reason?: string;
}

/* ── Respuestas de acción (camelCase, éxito) ──────────────────────────────── */

/** `POST /api/forum/posts` → post creado. */
export interface CreatePostResult {
  id: string;
  createdAt: string;
}

/** `POST /api/forum/posts/{id}/comments` → comentario creado. */
export interface CreateCommentResult {
  id: string;
  createdAt: string;
}

/** `POST /api/forum/posts/{id}/copy` → id de la rutina nueva (inactiva) en tu cuenta. */
export interface CopyRoutineResult {
  routineId: string;
}

/** `POST /api/forum/posts/{id}/like` → estado nuevo del like + total actualizado (UI optimista). */
export interface LikeToggleResult {
  liked: boolean;
  likeCount: number;
}

/** `.../report` → `hidden: true` si superó el umbral de denunciantes distintos (queda oculto). */
export interface ReportResult {
  reported: boolean;
  hidden: boolean;
}

/* ── Errores (PascalCase, regla de oro #3) ────────────────────────────────── */

/**
 * Cuerpo de error del foro. Lo serializa otro componente en PascalCase (distinto de los
 * éxitos en camelCase). El 422 de política de contenido agrega `FlaggedTerms`.
 */
export interface ForumErrorBody {
  StatusCode: number;
  Message: string;
  Timestamp: string;
  FlaggedTerms?: string[];
}
