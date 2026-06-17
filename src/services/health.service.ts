import apiClient from "../api/client";
import {
  BodyEvolutionDashboardDto,
  BodyMeasurementDto,
  BodyMeasurementPayload,
  HealthProfilePayload,
  Injury,
  MedicalCondition,
  PagedBodyMeasurementsResponseDto,
} from "../types/health";

interface BodyEvolutionDashboardFilters {
  fromDate?: string;
  toDate?: string;
}

/**
 * Obtiene la lista de lesiones disponibles.
 * @param token El token de autenticación de Clerk.
 */
export const getInjuries = async (token: string | null): Promise<Injury[]> => {
  const { data } = await apiClient.get<Injury[]>("/api/Health/injuries", {
    headers: { Authorization: `Bearer ${token}` },
  });
  return data;
};

/**
 * Obtiene la lista de afecciones médicas disponibles.
 * @param token El token de autenticación de Clerk.
 */
export const getMedicalConditions = async (
  token: string | null,
): Promise<MedicalCondition[]> => {
  const { data } = await apiClient.get<MedicalCondition[]>(
    "/api/Health/medical-conditions",
    {
      headers: { Authorization: `Bearer ${token}` },
    },
  );
  return data;
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
): Promise<PagedBodyMeasurementsResponseDto> => {
  const { data } = await apiClient.get<PagedBodyMeasurementsResponseDto>(
    "/api/health/body-measurements",
    {
      params: { page, pageSize },
      headers: { Authorization: `Bearer ${token}` },
    },
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
): Promise<BodyEvolutionDashboardDto> => {
  const params: BodyEvolutionDashboardFilters = {};
  if (filters.fromDate != null) params.fromDate = filters.fromDate;
  if (filters.toDate != null) params.toDate = filters.toDate;

  const { data } = await apiClient.get<BodyEvolutionDashboardDto>(
    "/api/health/body-measurements/dashboard",
    {
      params,
      headers: { Authorization: `Bearer ${token}` },
    },
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
): Promise<BodyMeasurementDto> => {
  const { data } = await apiClient.get<BodyMeasurementDto>(
    `/api/health/body-measurements/${id}`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  return (data as any)?.id != null ? data : ((data as any)?.data ?? data);
};
