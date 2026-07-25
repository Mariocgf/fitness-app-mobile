import apiClient from '../api/client';
import {
  CopyRoutineResult,
  CreateCommentRequest,
  CreateCommentResult,
  CreatePostRequest,
  CreatePostResult,
  ForumComment,
  ForumErrorBody,
  ForumPostDetail,
  ForumPostSummary,
  LikeToggleResult,
  MyForumPostSummary,
  PagedResponse,
  ReportResult,
} from '../types/forum';
import { withRequestSignal } from '../utils/request-cancellation';

const BASE = '/api/forum';

/**
 * Desenvuelve respuestas que el backend puede mandar como `{ data: T }` con una sola
 * key (mismo helper que los demás services; ver lección "respuesta envuelta").
 */
const unwrapApiData = <T>(value: T | { data: T }): T => {
  if (
    value &&
    typeof value === 'object' &&
    'data' in value &&
    Object.keys(value).length === 1
  ) {
    return (value as { data: T }).data;
  }
  return value as T;
};

/**
 * Lee el cuerpo de error del foro en PascalCase (regla de oro #3). Distinto de los
 * éxitos en camelCase: acá es `StatusCode`/`Message`/`FlaggedTerms`.
 */
const getErrorBody = (error: unknown): Partial<ForumErrorBody> | undefined =>
  (error as { response?: { data?: Partial<ForumErrorBody> } })?.response?.data;

const getStatus = (error: unknown): number | undefined =>
  (error as { response?: { status?: number } })?.response?.status;

/* ── Errores tipados ──────────────────────────────────────────────────────── */

/**
 * 422 — Política de contenido. El back corre un filtro angosto de amenazas/autodaño
 * (ej. "matate"), NO de insultos. Rechaza sin publicar y devuelve `FlaggedTerms` para
 * que el front los resalte y el usuario los corrija.
 */
export class ContentBlockedError extends Error {
  readonly flaggedTerms: string[];
  constructor(message: string, flaggedTerms: string[]) {
    super(message);
    this.name = 'ContentBlockedError';
    this.flaggedTerms = flaggedTerms;
  }
}

export const isContentBlockedError = (error: unknown): error is ContentBlockedError =>
  error instanceof ContentBlockedError;

/**
 * 403 al copiar — Alcanzaste el límite de rutinas de tu plan (Free/Nutrición topean;
 * Fitness/Full copian sin límite). El `Message` trae el texto accionable de upgrade.
 */
export class RoutineLimitError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RoutineLimitError';
  }
}

export const isRoutineLimitError = (error: unknown): error is RoutineLimitError =>
  error instanceof RoutineLimitError;

/**
 * Mapea errores HTTP genéricos del foro a mensajes ES amigables. El llamador puede
 * pasar mensajes específicos por código (ej. el 400 de "denunciar lo propio").
 */
const mapForumError = (
  error: unknown,
  overrides?: Partial<Record<number, string>>,
): Error => {
  const status = getStatus(error);
  if (status && overrides?.[status]) return new Error(overrides[status]!);
  switch (status) {
    case 400:
      return new Error('La solicitud es inválida. Revisá los datos e intentá de nuevo.');
    case 401:
      return new Error('Tu sesión expiró. Iniciá sesión otra vez.');
    case 404:
      // 404 = inexistente u oculto por moderación (se trata igual: "no existe").
      return new Error('Esta publicación ya no está disponible.');
    default:
      return new Error('Algo salió mal en la comunidad. Reintentá en un momento.');
  }
};

const authHeaders = (token: string | null) => ({ Authorization: `Bearer ${token}` });

/* ── Posts ────────────────────────────────────────────────────────────────── */

/**
 * Publica un post. `attachedRoutineVersionId` debe ser una versión de rutina TUYA
 * (o null = post solo texto). 422 → `ContentBlockedError` con los términos marcados.
 */
export const createPost = async (
  payload: CreatePostRequest,
  token: string | null,
): Promise<CreatePostResult> => {
  try {
    const { data } = await apiClient.post<CreatePostResult | { data: CreatePostResult }>(
      `${BASE}/posts`,
      payload,
      { headers: authHeaders(token) },
    );
    return unwrapApiData(data);
  } catch (error) {
    if (getStatus(error) === 422) {
      const body = getErrorBody(error);
      throw new ContentBlockedError(
        body?.Message ?? 'Tu publicación contiene términos no permitidos. Editá el texto para publicar.',
        body?.FlaggedTerms ?? [],
      );
    }
    throw mapForumError(error, {
      400: 'Revisá el título y el cuerpo. Si adjuntaste una rutina, tiene que ser tuya.',
    });
  }
};

/** Feed paginado. Más nuevos primero. Sin flags (van en el detalle). */
export const fetchFeed = async (
  token: string | null,
  page: number = 1,
  pageSize: number = 10,
  signal?: AbortSignal,
): Promise<PagedResponse<ForumPostSummary>> => {
  try {
    const { data } = await apiClient.get<
      PagedResponse<ForumPostSummary> | { data: PagedResponse<ForumPostSummary> }
    >(
      `${BASE}/posts`,
      withRequestSignal({ headers: authHeaders(token), params: { page, pageSize } }, signal),
    );
    return unwrapApiData(data);
  } catch (error) {
    throw mapForumError(error);
  }
};

/**
 * Mis publicaciones, paginadas (más nuevas primero). A diferencia del feed, INCLUYE las
 * ocultas por moderación con su `isHidden`: sin ese estado el autor no podría distinguir
 * una publicación ocultada de una borrada.
 */
export const fetchMyPosts = async (
  token: string | null,
  page: number = 1,
  pageSize: number = 10,
  signal?: AbortSignal,
): Promise<PagedResponse<MyForumPostSummary>> => {
  try {
    const { data } = await apiClient.get<
      PagedResponse<MyForumPostSummary> | { data: PagedResponse<MyForumPostSummary> }
    >(
      `${BASE}/me/posts`,
      withRequestSignal({ headers: authHeaders(token), params: { page, pageSize } }, signal),
    );
    return unwrapApiData(data);
  } catch (error) {
    throw mapForumError(error);
  }
};

/** Detalle del post con `attachedRoutine` (o null) y `flags`. 404 = no existe/oculto. */
export const getPostDetail = async (
  id: string,
  token: string | null,
  signal?: AbortSignal,
): Promise<ForumPostDetail> => {
  try {
    const { data } = await apiClient.get<ForumPostDetail | { data: ForumPostDetail }>(
      `${BASE}/posts/${id}`,
      withRequestSignal({ headers: authHeaders(token) }, signal),
    );
    return unwrapApiData(data);
  } catch (error) {
    throw mapForumError(error);
  }
};

/**
 * Copia la rutina adjunta a tu cuenta (nueva rutina INACTIVA, gratis, no desplaza la activa).
 * 403 → `RoutineLimitError` (límite del plan; el `Message` es accionable). 400 = sin rutina adjunta.
 */
export const copyRoutine = async (
  id: string,
  token: string | null,
): Promise<CopyRoutineResult> => {
  try {
    const { data } = await apiClient.post<CopyRoutineResult | { data: CopyRoutineResult }>(
      `${BASE}/posts/${id}/copy`,
      {},
      { headers: authHeaders(token) },
    );
    return unwrapApiData(data);
  } catch (error) {
    if (getStatus(error) === 403) {
      const body = getErrorBody(error);
      throw new RoutineLimitError(
        body?.Message ?? 'Alcanzaste el límite de rutinas de tu plan. Mejorá tu plan para copiar más.',
      );
    }
    throw mapForumError(error, {
      400: 'Este post no tiene una rutina para copiar.',
      404: 'El post ya no existe o su rutina no está disponible.',
    });
  }
};

/** Toggle de like. Apto para UI optimista. El like es status, sin créditos ni recompensa. */
export const toggleLike = async (
  id: string,
  token: string | null,
): Promise<LikeToggleResult> => {
  try {
    const { data } = await apiClient.post<LikeToggleResult | { data: LikeToggleResult }>(
      `${BASE}/posts/${id}/like`,
      {},
      { headers: authHeaders(token) },
    );
    return unwrapApiData(data);
  } catch (error) {
    throw mapForumError(error);
  }
};

/** Denuncia un post. Idempotente. `hidden: true` al superar el umbral de denunciantes distintos. */
export const reportPost = async (
  id: string,
  reason: string | undefined,
  token: string | null,
): Promise<ReportResult> => {
  try {
    const { data } = await apiClient.post<ReportResult | { data: ReportResult }>(
      `${BASE}/posts/${id}/report`,
      { reason },
      { headers: authHeaders(token) },
    );
    return unwrapApiData(data);
  } catch (error) {
    throw mapForumError(error, { 400: 'No podés denunciar tu propio post.' });
  }
};

/* ── Comentarios ──────────────────────────────────────────────────────────── */

/** Comenta (plano). 422 → `ContentBlockedError`. 404 = el post no existe o está oculto. */
export const createComment = async (
  postId: string,
  payload: CreateCommentRequest,
  token: string | null,
): Promise<CreateCommentResult> => {
  try {
    const { data } = await apiClient.post<CreateCommentResult | { data: CreateCommentResult }>(
      `${BASE}/posts/${postId}/comments`,
      payload,
      { headers: authHeaders(token) },
    );
    return unwrapApiData(data);
  } catch (error) {
    if (getStatus(error) === 422) {
      const body = getErrorBody(error);
      throw new ContentBlockedError(
        body?.Message ?? 'Tu comentario contiene términos no permitidos. Editá el texto para publicar.',
        body?.FlaggedTerms ?? [],
      );
    }
    throw mapForumError(error, { 400: 'El comentario está vacío o es demasiado largo.' });
  }
};

/** Lista paginada de comentarios. Más nuevos primero. Los ocultos por moderación no aparecen. */
export const fetchComments = async (
  postId: string,
  token: string | null,
  page: number = 1,
  pageSize: number = 10,
  signal?: AbortSignal,
): Promise<PagedResponse<ForumComment>> => {
  try {
    const { data } = await apiClient.get<
      PagedResponse<ForumComment> | { data: PagedResponse<ForumComment> }
    >(
      `${BASE}/posts/${postId}/comments`,
      withRequestSignal({ headers: authHeaders(token), params: { page, pageSize } }, signal),
    );
    return unwrapApiData(data);
  } catch (error) {
    throw mapForumError(error);
  }
};

/** Denuncia un comentario. Igual que denunciar post (idempotente, umbral → oculto). */
export const reportComment = async (
  commentId: string,
  reason: string | undefined,
  token: string | null,
): Promise<ReportResult> => {
  try {
    const { data } = await apiClient.post<ReportResult | { data: ReportResult }>(
      `${BASE}/comments/${commentId}/report`,
      { reason },
      { headers: authHeaders(token) },
    );
    return unwrapApiData(data);
  } catch (error) {
    throw mapForumError(error, { 400: 'No podés denunciar tu propio comentario.' });
  }
};
