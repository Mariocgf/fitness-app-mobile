import apiClient from '../api/client';
import { creditsEvents } from '../store/credits-events';
import {
  CreditsBalanceDto,
  PurchaseAddonRequest,
  PurchaseAddonResultDto,
  SubscriptionPlanDto,
  SubscriptionStatusDto,
  ValidatePurchaseRequest,
} from '../types/subscription';
import { logger } from '../utils/logger';
import { withRequestSignal } from '../utils/request-cancellation';

/**
 * Desenvuelve respuestas que el backend puede mandar como `{ data: T }` con una
 * sola key (mismo helper que los demás services; ver lección "respuesta envuelta").
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
 * Error tipado para el 402 (créditos insuficientes) de las acciones de IA. Se
 * lanza acá y en los services de rutina/nutrición para que los handlers de UI lo
 * atrapen y ofrezcan add-on/upgrade en vez del mensaje de error genérico.
 */
export class InsufficientCreditsError extends Error {
  constructor(message = 'No tenés créditos suficientes para esta acción.') {
    super(message);
    this.name = 'InsufficientCreditsError';
  }
}

/** True si el error de axios corresponde a un 402 Payment Required. */
export const isInsufficientCreditsError = (error: unknown): boolean =>
  error instanceof InsufficientCreditsError ||
  (error as { response?: { status?: number } })?.response?.status === 402;

/** Mapea errores HTTP de los endpoints de suscripción a mensajes ES amigables. */
const mapSubscriptionError = (error: unknown): Error => {
  const status = (error as { response?: { status?: number } })?.response?.status;
  switch (status) {
    case 400:
      return new Error('La solicitud de compra es inválida. Revisá los datos e intentá de nuevo.');
    case 401:
      return new Error('Tu sesión expiró. Iniciá sesión otra vez.');
    case 402:
      return new InsufficientCreditsError();
    case 404:
      return new Error('No encontramos tu cuenta. Cerrá sesión y volvé a entrar.');
    case 409:
      return new Error('Hubo un conflicto con tu suscripción. Reintentá en un momento.');
    case 503:
      return new Error('La tienda no está disponible en este momento. Reintentá más tarde.');
    default:
      return new Error('Algo salió mal con la suscripción. Reintentá en un momento.');
  }
};

/**
 * Lista los planes activos del catálogo (incluye Free con `productId: null`).
 * El `price` es de referencia; el precio real lo trae el store/emulador.
 * @param token Token de autenticación de Clerk.
 */
export const getSubscriptionPlans = async (
  token: string | null,
  signal?: AbortSignal,
): Promise<SubscriptionPlanDto[]> => {
  try {
    const { data } = await apiClient.get<SubscriptionPlanDto[] | { data: SubscriptionPlanDto[] }>(
      '/api/subscription/plans',
      withRequestSignal({ headers: { Authorization: `Bearer ${token}` } }, signal),
    );
    return unwrapApiData(data);
  } catch (error) {
    throw mapSubscriptionError(error);
  }
};

/**
 * Estado de suscripción del usuario. Sin suscripción activa devuelve Free
 * (`status: "none"`), nunca 404.
 * @param token Token de autenticación de Clerk.
 */
export const getMySubscription = async (
  token: string | null,
  signal?: AbortSignal,
): Promise<SubscriptionStatusDto> => {
  try {
    const { data } = await apiClient.get<SubscriptionStatusDto | { data: SubscriptionStatusDto }>(
      '/api/subscription/me',
      withRequestSignal({ headers: { Authorization: `Bearer ${token}` } }, signal),
    );
    return unwrapApiData(data);
  } catch (error) {
    throw mapSubscriptionError(error);
  }
};

/**
 * Saldo real del wallet de créditos.
 *
 * Es la única fuente de verdad de "cuántos créditos me quedan". `GET /me` NO lo trae:
 * su `monthlyCredits` es el cupo del plan (Free = 0), no el saldo. El wallet lo mueve
 * el backend (bienvenida, renovación, add-ons, consumo y reembolsos de IA), así que
 * siempre se consulta — nunca se calcula ni se cachea en el cliente.
 *
 * @param token Token de autenticación de Clerk.
 */
export const getCreditsBalance = async (
  token: string | null,
  signal?: AbortSignal,
): Promise<CreditsBalanceDto> => {
  try {
    const { data } = await apiClient.get<CreditsBalanceDto | { data: CreditsBalanceDto }>(
      '/api/subscription/credits',
      withRequestSignal({ headers: { Authorization: `Bearer ${token}` } }, signal),
    );
    return unwrapApiData(data);
  } catch (error) {
    throw mapSubscriptionError(error);
  }
};

/**
 * Valida una compra contra el backend (que a su vez valida contra la store).
 * Idempotente: revalidar la misma compra no duplica ni recompensa.
 * @param request Plataforma, productId y receipt/token de la compra.
 * @param token Token de autenticación de Clerk.
 */
export const validatePurchase = async (
  request: ValidatePurchaseRequest,
  token: string | null,
): Promise<SubscriptionStatusDto> => {
  try {
    const { data } = await apiClient.post<SubscriptionStatusDto | { data: SubscriptionStatusDto }>(
      '/api/subscription/validate',
      request,
      { headers: { Authorization: `Bearer ${token}` } },
    );
    return unwrapApiData(data);
  } catch (error) {
    throw mapSubscriptionError(error);
  } finally {
    // Activar un plan otorga el primer pool mensual de créditos: el saldo cambió.
    creditsEvents.emitWalletChanged();
  }
};

/**
 * Compra el add-on consumible de +10 créditos sobre un plan pago activo.
 * `granted: false` en la respuesta NO es error (200): leer `reason`.
 * @param request Plataforma, productId (`credits_addon`) y receipt/token.
 * @param token Token de autenticación de Clerk.
 */
export const purchaseCreditsAddon = async (
  request: PurchaseAddonRequest,
  token: string | null,
): Promise<PurchaseAddonResultDto> => {
  logger.log('[subscription.service] POST /api/subscription/credits/addon:', request);
  try {
    const { data } = await apiClient.post<PurchaseAddonResultDto | { data: PurchaseAddonResultDto }>(
      '/api/subscription/credits/addon',
      request,
      { headers: { Authorization: `Bearer ${token}` } },
    );
    const result = unwrapApiData(data);
    logger.log('[subscription.service] credits/addon OK:', result);
    return result;
  } catch (error) {
    logger.error('[subscription.service] credits/addon FALLÓ:', error);
    throw mapSubscriptionError(error);
  } finally {
    // El add-on suma +10 al wallet. También emitimos en `granted: false` por idempotencia
    // ("ya fue otorgado"): el saldo YA lo incluye y hay que reflejarlo igual.
    creditsEvents.emitWalletChanged();
  }
};
