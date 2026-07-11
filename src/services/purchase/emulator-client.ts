import axios from 'axios';

import { AdminCatalogDto } from '../../types/subscription';

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

const emulatorClient = axios.create({
  baseURL: EMULATOR_URL,
  headers: {
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': 'true',
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
  const { data } = await emulatorClient.get<AdminCatalogDto>(
    '/admin/catalog',
    signal ? { signal } : undefined,
  );
  return data;
};
