import apiClient from "../api/client";
import {
  BodyEvolutionDashboardDto,
  BodyMeasurementDto,
  BodyMeasurementPayload,
  HealthProfilePayload,
  Injury,
  MedicalCondition,
  PagedBodyMeasurementsResponseDto,
  UserMedicalConditionDto,
} from "../types/health";
import { withRequestSignal } from "../utils/request-cancellation";

interface BodyEvolutionDashboardFilters {
  fromDate?: string;
  toDate?: string;
}

/**
 * Obtiene la lista de lesiones disponibles.
 * @param token El token de autenticación de Clerk.
 */
export const getInjuries = async (
  token: string | null,
  signal?: AbortSignal,
): Promise<Injury[]> => {
  const { data } = await apiClient.get<Injury[]>("/api/Health/injuries", {
    headers: { Authorization: `Bearer ${token}` },
    ...(signal ? { signal } : {}),
  });
  return data;
};

/**
 * Obtiene la lista de afecciones médicas disponibles.
 * @param token El token de autenticación de Clerk.
 */
export const getMedicalConditions = async (
  token: string | null,
  signal?: AbortSignal,
): Promise<MedicalCondition[]> => {
  const { data } = await apiClient.get<MedicalCondition[]>(
    "/api/Health/medical-conditions",
    withRequestSignal({
      headers: { Authorization: `Bearer ${token}` },
    }, signal),
  );
  return data;
};

/**
 * Obtiene las condiciones médicas asociadas al usuario, cada una con su estado de
 * consentimiento de uso por la IA (`allowAiUsage`). El `name` ya viene traducido.
 * @param token Token de autenticación de Clerk.
 */
export const getUserMedicalConditions = async (
  token: string | null,
  signal?: AbortSignal,
): Promise<UserMedicalConditionDto[]> => {
  const { data } = await apiClient.get<UserMedicalConditionDto[]>(
    "/api/health/user-medical-conditions",
    withRequestSignal({
      headers: { Authorization: `Bearer ${token}` },
    }, signal),
  );
  const raw = (data as any)?.data ?? data;
  return Array.isArray(raw) ? raw : [];
};

/**
 * Habilita o deshabilita el uso por la IA de UNA condición médica del usuario.
 * El backend responde 204. Si la condición no pertenece al usuario, responde error.
 * @param conditionId Id de la condición (del GET de condiciones del usuario).
 * @param enabled Nuevo estado del consentimiento para esa condición.
 * @param token Token de autenticación de Clerk.
 */
export const setMedicalConditionAiConsent = async (
  conditionId: string,
  enabled: boolean,
  token: string | null,
): Promise<void> => {
  await apiClient.put(
    "/api/health/user-medical-conditions/ai-consent",
    { conditionId, enabled },
    { headers: { Authorization: `Bearer ${token}` } },
  );
};

/**
 * Envía el perfil de salud del usuario (lesiones y afecciones médicas).
 * @param payload Los IDs de lesiones y afecciones seleccionadas.
 * @param token El token de autenticación de Clerk.
 */
export const submitHealthProfile = async (
  payload: HealthProfilePayload,
  token: string | null,
) => {
  const { data } = await apiClient.post(
    "/api/Onboarding/module/health",
    payload,
    {
      headers: { Authorization: `Bearer ${token}` },
    },
  );
  return data;
};

/**
 * Registra una nueva medición corporal del usuario.
 * Todos los campos del payload son opcionales; el servidor calcula grasa y masa magra si hay datos suficientes.
 * @param payload Campos de la medición a registrar.
 * @param token Token de autenticación de Clerk.
 */
export const postBodyMeasurement = async (
  payload: BodyMeasurementPayload,
  token: string | null,
): Promise<BodyMeasurementDto> => {
  const { data } = await apiClient.post<BodyMeasurementDto>(
    "/api/health/body-measurements",
    payload,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  // Defensa: si el backend envuelve la respuesta en { data: ... }, extraerla
  return (data as any)?.id != null ? data : ((data as any)?.data ?? data);
};

/**
 * Obtiene el historial paginado de mediciones corporales del usuario autenticado.
 * La respuesta viene ordenada descendente (más reciente primero).
 * @param token Token de autenticación de Clerk.
 * @param page Número de página (base 1). Por defecto 1.
 * @param pageSize Cantidad de ítems por página. Por defecto 4.
 */
export const getBodyMeasurements = async (
  token: string | null,
  page = 1,
  pageSize = 4,
  signal?: AbortSignal,
): Promise<PagedBodyMeasurementsResponseDto> => {
  const { data } = await apiClient.get<PagedBodyMeasurementsResponseDto>(
    "/api/health/body-measurements",
    withRequestSignal({
      params: { page, pageSize },
      headers: { Authorization: `Bearer ${token}` },
    }, signal),
  );
  // Defensa: si el backend envuelve la respuesta en { data: ... }, extraerla
  const raw = (data as any)?.items != null ? data : ((data as any)?.data ?? data);
  return {
    page: raw.page ?? page,
    pageSize: raw.pageSize ?? pageSize,
    totalCount: raw.totalCount ?? 0,
    items: Array.isArray(raw.items) ? raw.items : [],
  };
};

/**
 * Obtiene las series de evolución física para graficar peso y perímetros.
 * @param token Token de autenticación de Clerk.
 * @param filters Rango opcional de fechas en formato YYYY-MM-DD.
 */
export const getBodyEvolutionDashboard = async (
  token: string | null,
  filters: BodyEvolutionDashboardFilters = {},
  signal?: AbortSignal,
): Promise<BodyEvolutionDashboardDto> => {
  const params: BodyEvolutionDashboardFilters = {};
  if (filters.fromDate != null) params.fromDate = filters.fromDate;
  if (filters.toDate != null) params.toDate = filters.toDate;

  const { data } = await apiClient.get<BodyEvolutionDashboardDto>(
    "/api/health/body-measurements/dashboard",
    withRequestSignal({
      params,
      headers: { Authorization: `Bearer ${token}` },
    }, signal),
  );

  // Defensa: si el backend envuelve la respuesta en { data: ... }, extraerla
  const raw = (data as any)?.metrics != null ? data : ((data as any)?.data ?? data);
  return {
    fromDate: raw.fromDate ?? null,
    toDate: raw.toDate ?? null,
    metrics: Array.isArray(raw.metrics) ? raw.metrics : [],
  };
};

/**
 * Obtiene el detalle de una medición corporal por su ID.
 * Usado en el historial cuando el usuario abre el detalle de una medición pasada.
 * @param id UUID de la medición.
 * @param token Token de autenticación de Clerk.
 */
export const getBodyMeasurementById = async (
  id: string,
  token: string | null,
  signal?: AbortSignal,
): Promise<BodyMeasurementDto> => {
  const { data } = await apiClient.get<BodyMeasurementDto>(
    `/api/health/body-measurements/${id}`,
    withRequestSignal({ headers: { Authorization: `Bearer ${token}` } }, signal),
  );
  return (data as any)?.id != null ? data : ((data as any)?.data ?? data);
};

/**
 * Elimina una medición corporal por su ID.
 * El backend responde 204 si borra correctamente y 404 si no existe o no pertenece al usuario.
 * @param id UUID de la medición.
 * @param token Token de autenticación de Clerk.
 */
export const deleteBodyMeasurement = async (
  id: string,
  token: string | null,
): Promise<void> => {
  await apiClient.delete(`/api/health/body-measurements/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
};
