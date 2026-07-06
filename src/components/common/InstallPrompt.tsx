/**
 * Prompt de instalación de la PWA. En nativo (iOS/Android) no aplica: la app ya
 * es una app real, así que este componente base no renderiza nada. Toda la lógica
 * de `beforeinstallprompt` / "Añadir a inicio" vive en `InstallPrompt.web.tsx`,
 * que Metro resuelve solo para el bundle web (mismo patrón que `AppFrame`).
 */
export function InstallPrompt() {
  return null;
}
