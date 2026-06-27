import apiClient from "../api/client";
import {
  AddHydrationLogDto,
  AddMeditationSessionDto,
  AddMoodLogDto,
  AddSleepLogDto,
  HydrationLogDto,
  MeditationGuideDto,
  MeditationSessionDto,
  MoodLogDto,
  PagedResponseDto,
  SleepLogDto,
} from "../types/wellness";

/**
 * Defensa: algunos endpoints pueden envolver el DTO en { data: ... }.
 * Si el objeto plano ya trae `marker`, se usa tal cual; si no, se baja un nivel.
 */
const unwrap = <T>(data: unknown, marker: keyof T): T => {
  const d = data as any;
  return d?.[marker] !== undefined ? d : (d?.data ?? d);
};

/** Normaliza una respuesta paginada (defensa por si viene envuelta o con campos faltantes). */
const unwrapPaged = <T>(
  data: unknown,
  page: number,
  pageSize: number,
): PagedResponseDto<T> => {
  const raw = unwrap<PagedResponseDto<T>>(data, "items");
  return {
    page: raw?.page ?? page,
    pageSize: raw?.pageSize ?? pageSize,
    totalCount: raw?.totalCount ?? 0,
    items: Array.isArray(raw?.items) ? raw.items : [],
  };
};

/** Header de autenticación reutilizable. */
const authHeader = (token: string | null) => ({
  headers: { Authorization: `Bearer ${token}` },
});

// ─── Sueño ───────────────────────────────────────────────────────────────────

/** Registra una entrada de sueño del usuario actual. */
export const postSleepLog = async (
  payload: AddSleepLogDto,
  token: string | null,
): Promise<SleepLogDto> => {
  const { data } = await apiClient.post<SleepLogDto>(
    "/api/sleep",
    payload,
    authHeader(token),
  );
  return unwrap<SleepLogDto>(data, "id");
};

/** Obtiene el historial de sueño paginado (descendente por fecha). */
export const getSleepLogs = async (
  token: string | null,
  page = 1,
  pageSize = 10,
): Promise<PagedResponseDto<SleepLogDto>> => {
  const { data } = await apiClient.get<PagedResponseDto<SleepLogDto>>(
    "/api/sleep",
    { params: { page, pageSize }, ...authHeader(token) },
  );
  return unwrapPaged<SleepLogDto>(data, page, pageSize);
};

/** Obtiene el detalle de un registro de sueño por su ID. */
export const getSleepLogById = async (
  id: string,
  token: string | null,
): Promise<SleepLogDto> => {
  const { data } = await apiClient.get<SleepLogDto>(
    `/api/sleep/${id}`,
    authHeader(token),
  );
  return unwrap<SleepLogDto>(data, "id");
};

/** Elimina un registro de sueño del usuario actual. */
export const deleteSleepLog = async (
  id: string,
  token: string | null,
): Promise<void> => {
  await apiClient.delete(`/api/sleep/${id}`, authHeader(token));
};

// ─── Hidratación ─────────────────────────────────────────────────────────────

/** Registra un registro de hidratación (bebida consumida). */
export const postHydrationLog = async (
  payload: AddHydrationLogDto,
  token: string | null,
): Promise<HydrationLogDto> => {
  const { data } = await apiClient.post<HydrationLogDto>(
    "/api/hydration",
    payload,
    authHeader(token),
  );
  return unwrap<HydrationLogDto>(data, "id");
};

/** Obtiene el historial de hidratación paginado (descendente por fecha). */
export const getHydrationLogs = async (
  token: string | null,
  page = 1,
  pageSize = 10,
): Promise<PagedResponseDto<HydrationLogDto>> => {
  const { data } = await apiClient.get<PagedResponseDto<HydrationLogDto>>(
    "/api/hydration",
    { params: { page, pageSize }, ...authHeader(token) },
  );
  return unwrapPaged<HydrationLogDto>(data, page, pageSize);
};

/** Obtiene el detalle de un registro de hidratación por su ID. */
export const getHydrationLogById = async (
  id: string,
  token: string | null,
): Promise<HydrationLogDto> => {
  const { data } = await apiClient.get<HydrationLogDto>(
    `/api/hydration/${id}`,
    authHeader(token),
  );
  return unwrap<HydrationLogDto>(data, "id");
};

/** Elimina un registro de hidratación del usuario actual. */
export const deleteHydrationLog = async (
  id: string,
  token: string | null,
): Promise<void> => {
  await apiClient.delete(`/api/hydration/${id}`, authHeader(token));
};

// ─── Ánimo ───────────────────────────────────────────────────────────────────

/** Registra cómo se siente el usuario en un momento dado. */
export const postMoodLog = async (
  payload: AddMoodLogDto,
  token: string | null,
): Promise<MoodLogDto> => {
  const { data } = await apiClient.post<MoodLogDto>(
    "/api/mood",
    payload,
    authHeader(token),
  );
  return unwrap<MoodLogDto>(data, "id");
};

/** Obtiene el historial de ánimo paginado (descendente por fecha). */
export const getMoodLogs = async (
  token: string | null,
  page = 1,
  pageSize = 10,
): Promise<PagedResponseDto<MoodLogDto>> => {
  const { data } = await apiClient.get<PagedResponseDto<MoodLogDto>>(
    "/api/mood",
    { params: { page, pageSize }, ...authHeader(token) },
  );
  return unwrapPaged<MoodLogDto>(data, page, pageSize);
};

/** Obtiene el detalle de un registro de ánimo por su ID. */
export const getMoodLogById = async (
  id: string,
  token: string | null,
): Promise<MoodLogDto> => {
  const { data } = await apiClient.get<MoodLogDto>(
    `/api/mood/${id}`,
    authHeader(token),
  );
  return unwrap<MoodLogDto>(data, "id");
};

/** Elimina un registro de ánimo del usuario actual. */
export const deleteMoodLog = async (
  id: string,
  token: string | null,
): Promise<void> => {
  await apiClient.delete(`/api/mood/${id}`, authHeader(token));
};

// ─── Meditación: catálogo de guías ───────────────────────────────────────────

/** Obtiene el catálogo de guías de meditación disponibles (solo activas). */
export const getMeditationGuides = async (
  token: string | null,
  page = 1,
  pageSize = 10,
): Promise<PagedResponseDto<MeditationGuideDto>> => {
  const { data } = await apiClient.get<PagedResponseDto<MeditationGuideDto>>(
    "/api/meditation/guides",
    { params: { page, pageSize }, ...authHeader(token) },
  );
  return unwrapPaged<MeditationGuideDto>(data, page, pageSize);
};

/** Obtiene el detalle de una guía de meditación por su ID. */
export const getMeditationGuideById = async (
  id: string,
  token: string | null,
): Promise<MeditationGuideDto> => {
  const { data } = await apiClient.get<MeditationGuideDto>(
    `/api/meditation/guides/${id}`,
    authHeader(token),
  );
  return unwrap<MeditationGuideDto>(data, "id");
};

// ─── Meditación: sesiones del usuario ────────────────────────────────────────

/** Registra una sesión de meditación; puede referenciar una guía del catálogo. */
export const postMeditationSession = async (
  payload: AddMeditationSessionDto,
  token: string | null,
): Promise<MeditationSessionDto> => {
  const { data } = await apiClient.post<MeditationSessionDto>(
    "/api/meditation",
    payload,
    authHeader(token),
  );
  return unwrap<MeditationSessionDto>(data, "id");
};

/** Obtiene el historial de sesiones de meditación paginado (descendente por fecha). */
export const getMeditationSessions = async (
  token: string | null,
  page = 1,
  pageSize = 10,
): Promise<PagedResponseDto<MeditationSessionDto>> => {
  const { data } = await apiClient.get<PagedResponseDto<MeditationSessionDto>>(
    "/api/meditation",
    { params: { page, pageSize }, ...authHeader(token) },
  );
  return unwrapPaged<MeditationSessionDto>(data, page, pageSize);
};

/** Obtiene el detalle de una sesión de meditación por su ID. */
export const getMeditationSessionById = async (
  id: string,
  token: string | null,
): Promise<MeditationSessionDto> => {
  const { data } = await apiClient.get<MeditationSessionDto>(
    `/api/meditation/${id}`,
    authHeader(token),
  );
  return unwrap<MeditationSessionDto>(data, "id");
};

/** Elimina una sesión de meditación del usuario actual. */
export const deleteMeditationSession = async (
  id: string,
  token: string | null,
): Promise<void> => {
  await apiClient.delete(`/api/meditation/${id}`, authHeader(token));
};
