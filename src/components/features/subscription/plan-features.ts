import { Ionicons } from '@expo/vector-icons';

import { PlanViewModel } from '@/src/types/subscription';

type IoniconName = keyof typeof Ionicons.glyphMap;

/** Beneficio suelto del bloque "Qué incluye" del paywall. */
export interface PlanFeature {
  icon: IoniconName;
  label: string;
}

/**
 * Qué HACE cada módulo, en lenguaje de usuario.
 *
 * OJO con la separación de responsabilidades: quién desbloquea qué lo decide SIEMPRE
 * el backend (`unlockedModules` de `GET /plans`); este mapa solo pone en palabras la
 * funcionalidad que ya está implementada en la app. Por eso no hay una entrada por
 * tier: si mañana el backend mueve un módulo de un plan a otro, el paywall lo refleja
 * sin tocar este archivo.
 *
 * Cuando el backend exponga los beneficios en el propio DTO, se borra el mapa y
 * `getPlanFeatures` pasa a leerlos de ahí.
 */
const MODULE_FEATURES: Record<string, PlanFeature[]> = {
  fitness: [
    { icon: 'barbell-outline', label: 'Rutinas de entrenamiento generadas con IA' },
    { icon: 'play-circle-outline', label: 'Sesiones guiadas con series, RPE y descansos' },
  ],
  nutrition: [
    { icon: 'restaurant-outline', label: 'Planes de comida generados con IA' },
    { icon: 'barcode-outline', label: 'Registro de comidas con escáner de código de barras' },
  ],
};

/** Fallback para un módulo que el backend agregue y este mapa todavía no describa. */
const genericModuleFeature = (moduleName: string): PlanFeature => ({
  icon: 'checkmark-circle-outline',
  label: `Módulo ${moduleName}`,
});

/**
 * Beneficios del plan: los módulos que el backend desbloquea (traducidos a
 * funcionalidad concreta) más el cupo mensual de créditos, que también es dato real
 * del plan. Nada acá se inventa: si el módulo no viene, el beneficio no se muestra.
 */
export const getPlanFeatures = (plan: PlanViewModel): PlanFeature[] => [
  ...plan.unlockedModules.flatMap(
    (moduleName) => MODULE_FEATURES[moduleName] ?? [genericModuleFeature(moduleName)],
  ),
  {
    icon: 'sparkles-outline',
    label: `${plan.monthlyCredits} créditos mensuales para generar con IA`,
  },
];
