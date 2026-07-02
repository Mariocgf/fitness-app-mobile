/**
 * OPFS + createSyncAccessHandle solo se prueban de verdad dentro de un Worker
 * (ver expo-sqlite/web/wa-sqlite/AccessHandlePoolVFS.js); en el hilo principal
 * detectamos OPFS root + contexto seguro como proxy razonable de soporte.
 */
export const isOfflineStorageSupported = (): boolean =>
  typeof navigator !== 'undefined' &&
  typeof navigator.storage?.getDirectory === 'function' &&
  (typeof globalThis.isSecureContext === 'boolean' ? globalThis.isSecureContext : true);
