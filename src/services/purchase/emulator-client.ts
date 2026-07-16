import axios from 'axios';

import {
  AdminCatalogDto,
  EmulatorPurchaseRequest,
  EmulatorPurchaseResponse,
} from '../../types/subscription';
import { logger } from '../../utils/logger';

/**
 * Cliente del emulador IAP — SOLO desarrollo. Reemplaza al SDK del store para
 * "traer productos con precio" mientras no haya pago real. En prod, el
 * `store-purchase-provider` usa el SDK y este cliente NO se toca.
 *
 * Las credenciales son variables de entorno para cambiarlas por las reales sin
 * tocar código. La `X-Mock-Key` NO debe ir en un bundle público de prod/staging.
 */
const EMULATOR_URL =
  process.env.EXPO_PUBLIC_IAP_EMULATOR_URL || 'http://localhost:5247';
const EMULATOR_KEY = process.env.EXPO_PUBLIC_IAP_EMULATOR_KEY || '';

logger.log('[emulator-client] EMULATOR_URL:', EMULATOR_URL, '| key set:', Boolean(EMULATOR_KEY));

/**
 * NO agregar headers custom sin sumarlos al `Access-Control-Allow-Headers` del
 * emulador: su lista es FIJA (`Content-Type,X-Mock-Key`), no echoea como la API.
 * Cada header custom de más dispara un preflight que el emulador rechaza, y en el
 * browser eso se ve como un `Network Error` opaco, sin pista del header culpable.
 */
const emulatorClient = axios.create({
  baseURL: EMULATOR_URL,
  headers: {
    'Content-Type': 'application/json',
    'X-Mock-Key': EMULATOR_KEY,
  },
});

/**
 * Trae el catálogo del emulador (`GET /admin/catalog`), el mock de "productos con
 * precio" que en prod da el SDK del store. Lo consume solo el mock adapter.
 */
export const getAdminCatalog = async (
  signal?: AbortSignal,
): Promise<AdminCatalogDto> => {
  logger.log('[emulator-client] GET /admin/catalog →', EMULATOR_URL);
  try {
    const { data } = await emulatorClient.get<AdminCatalogDto>(
      '/admin/catalog',
      signal ? { signal } : undefined,
    );
    logger.log('[emulator-client] /admin/catalog OK, apps:', data?.apps?.length ?? 0);
    return data;
  } catch (error) {
    logger.error('[emulator-client] /admin/catalog FALLÓ:', error);
    throw error;
  }
};

/**
 * Ejecuta una compra emulada (`POST /store/purchases`) y devuelve el `receiptOrToken`
 * que el emulador GENERA y PERSISTE. En prod esto lo hace el SDK del store; acá el
 * emulador simula esa compra para que el backend pueda validarla contra su mock de
 * Apple/Google. NO es un endpoint `/admin/*`: no necesita `X-Mock-Key` (aunque el
 * cliente lo mande igual, es inocuo).
 */
export const createStorePurchase = async (
  request: EmulatorPurchaseRequest,
): Promise<EmulatorPurchaseResponse> => {
  logger.log('[emulator-client] POST /store/purchases →', request);
  try {
    const { data } = await emulatorClient.post<EmulatorPurchaseResponse>(
      '/store/purchases',
      request,
    );
    logger.log('[emulator-client] /store/purchases OK:', {
      productId: data?.productId,
      hasReceipt: Boolean(data?.receiptOrToken),
    });
    return data;
  } catch (error) {
    logger.error('[emulator-client] /store/purchases FALLÓ:', error);
    throw error;
  }
};
