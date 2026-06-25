import apiClient from "../api/client";
import {
  ClinicalProfileDto,
  ClinicalProfilePayload,
  ClinicalReadingDto,
  ClinicalReadingPayload,
  PagedClinicalReadingsResponseDto,
} from "../types/clinical";

/**
 * Defensa: algunos endpoints pueden envolver el DTO en { data: ... }.
 * Si el objeto plano ya trae `marker`, se usa tal cual; si no, se baja un nivel.
 */
const unwrap = <T>(data: unknown, marker: keyof T): T => {
  const d = data as any;
  return d?.[marker] !== undefined ? d : (d?.data ?? d);
};

// ─── Perfil clínico ──────────────────────────────────────────────────────────

/**
 * Obtiene el perfil clínico del usuario actual.
 * Si el usuario nunca cargó nada, el backend devuelve los valores por defecto (no falla).
 * @param token Token de autenticación de Clerk.
 */
export const getClinicalProfile = async (
  token: string | null,
): Promise<ClinicalProfileDto> => {
  const { data } = await apiClient.get<ClinicalProfileDto>(
    "/api/clinical/profile",
    { headers: { Authorization: `Bearer ${token}` } },
  );
  return unwrap<ClinicalProfileDto>(data, "hasGlucose");
};

/**
 * Actualiza grupo sanguíneo, Rh y flags del perfil clínico. Crea el perfil si no existía.
 * NO toca allowAiUsage (eso se maneja en updateAiConsent).
 * @param payload Campos del perfil a actualizar.
 * @param token Token de autenticación de Clerk.
 */
export const updateClinicalProfile = async (
  payload: ClinicalProfilePayload,
  token: string | null,
): Promise<ClinicalProfileDto> => {
  const { data } = await apiClient.put<ClinicalProfileDto>(
    "/api/clinical/profile",
    payload,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  return unwrap<ClinicalProfileDto>(data, "hasGlucose");
};

/**
 * Activa o desactiva el consentimiento de uso de datos clínicos por la IA.
 * Crea el perfil si no existía. Devuelve el perfil actualizado.
 * @param enabled Nuevo estado del consentimiento.
 * @param token Token de autenticación de Clerk.
 */
export const updateAiConsent = async (
  enabled: boolean,
  token: string | null,
): Promise<ClinicalProfileDto> => {
  const { data } = await apiClient.put<ClinicalProfileDto>(
    "/api/clinical/ai-consent",
    { enabled },
    { headers: { Authorization: `Bearer ${token}` } },
  );
  return unwrap<ClinicalProfileDto>(data, "hasGlucose");
};

// ─── Lecturas clínicas ───────────────────────────────────────────────────────

/**
 * Registra una nueva lectura clínica. Los valores son opcionales pero deben ser > 0.
 * @param payload Valores de la lectura a registrar.
 * @param token Token de autenticación de Clerk.
 */
export const postClinicalReading = async (
  payload: ClinicalReadingPayload,
  token: string | null,
): Promise<ClinicalReadingDto> => {
  const { data } = await apiClient.post<ClinicalReadingDto>(
    "/api/clinical/readings",
    payload,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  return unwrap<ClinicalReadingDto>(data, "id");
};

/**
 * Obtiene el historial paginado de lecturas clínicas, más reciente primero (por capturedAt).
 * @param token Token de autenticación de Clerk.
 * @param page Número de página (base 1). Por defecto 1.
 * @param pageSize Cantidad de ítems por página. Por defecto 10.
 */
export const getClinicalReadings = async (
  token: string | null,
  page = 1,
  pageSize = 10,
): Promise<PagedClinicalReadingsResponseDto> => {
  const { data } = await apiClient.get<PagedClinicalReadingsResponseDto>(
    "/api/clinical/readings",
    {
      params: { page, pageSize },
      headers: { Authorization: `Bearer ${token}` },
    },
  );
  const raw = unwrap<PagedClinicalReadingsResponseDto>(data, "items");
  return {
    page: raw.page ?? page,
    pageSize: raw.pageSize ?? pageSize,
    totalCount: raw.totalCount ?? 0,
    items: Array.isArray(raw.items) ? raw.items : [],
  };
};

/**
 * Obtiene el detalle de una lectura clínica por su ID. Solo devuelve lecturas del usuario actual.
 * @param id GUID de la lectura.
 * @param token Token de autenticación de Clerk.
 */
export const getClinicalReadingById = async (
  id: string,
  token: string | null,
): Promise<ClinicalReadingDto> => {
  const { data } = await apiClient.get<ClinicalReadingDto>(
    `/api/clinical/readings/${id}`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  return unwrap<ClinicalReadingDto>(data, "id");
};
