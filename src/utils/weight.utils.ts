import { WeightInventoryResponse } from '../services/equipment.service';
import { toEquipmentFamilies } from './equipment.utils';

/** Opción de peso para mostrar en la UI */
export interface WeightOption {
  label: string;
  value: number | null;
}

/** Resultado del cálculo de opciones de peso según el equipo */
export interface WeightOptionsResult {
  type: 'plate-loaded' | 'fixed-dumbbell' | 'bodyweight';
  options: WeightOption[];
  baseWeight?: number;
}

/**
 * Calcula las opciones de peso disponibles para un ejercicio
 * según el equipo que usa y el inventario del usuario.
 *
 * Un ejercicio puede admitir VARIOS equipos (ej: `["Peso corporal", "Mancuerna"]`),
 * así que se recorren todos y se unen sus pesos: un equipo sin carga listado
 * primero no puede tapar a los que sí la tienen.
 *
 * Las etiquetas del ejercicio llegan en español y el inventario habla inglés,
 * así que primero se normalizan a familias canónicas (ver `toEquipmentFamilies`).
 *
 * @param equipmentLabels Equipamiento del ejercicio tal como llega de la API.
 * @param inventory       Respuesta del endpoint weight-inventory del usuario.
 */
export const getWeightOptions = (
  equipmentLabels: string | string[] | null | undefined,
  inventory: WeightInventoryResponse | null
): WeightOption[] => {
  /** Opción base sin peso, siempre disponible */
  const noWeightOption: WeightOption = { label: 'Peso corporal', value: null };

  const families = (Array.isArray(equipmentLabels) ? equipmentLabels : [equipmentLabels])
    .filter((label): label is string => !!label)
    .flatMap(toEquipmentFamilies);

  if (families.length === 0 || !inventory) {
    return [noWeightOption];
  }

  /** Pesos con carga de todos los equipos del ejercicio, deduplicados por valor. */
  const byWeight = new Map<number, string>();

  for (const family of families) {
    /** 1. Equipo cargado por discos: buscar en plateCombinations por apiFamilyIdentifier */
    const plateCombo = inventory.plateCombinations.find(
      (c) => c.apiFamilyIdentifier === family
    );
    if (plateCombo) {
      /** Si el equipo tiene peso base (ej: barra = 20 kg), se aclara que va sin discos */
      if (plateCombo.baseWeight > 0) {
        byWeight.set(plateCombo.baseWeight, `${plateCombo.baseWeight} kg (sin discos)`);
      }
      for (const w of plateCombo.achievableWeights) {
        if (!byWeight.has(w)) byWeight.set(w, `${w} kg`);
      }
      continue;
    }

    /** 2. Mancuerna fija: usar dumbbellWeights */
    if (family === 'dumbbell') {
      for (const w of inventory.dumbbellWeights) {
        if (!byWeight.has(w)) byWeight.set(w, `${w} kg`);
      }
    }
  }

  /** 3. Fallback: bodyweight / sin equipo de carga en el inventario */
  if (byWeight.size === 0) {
    return [noWeightOption];
  }

  return [
    noWeightOption,
    ...[...byWeight.entries()]
      .sort(([a], [b]) => a - b)
      .map(([value, label]) => ({ label, value })),
  ];
};
