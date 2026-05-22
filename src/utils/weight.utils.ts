import { WeightInventoryResponse } from '../services/equipment.service';

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
 * @param equipmentId  Identificador del equipo (ej: "barbell", "dumbbell", "weighted").
 * @param inventory    Respuesta del endpoint weight-inventory del usuario.
 */
export const getWeightOptions = (
  equipmentId: string | undefined,
  inventory: WeightInventoryResponse | null
): WeightOption[] => {
  /** Opción base sin peso, siempre disponible */
  const noWeightOption: WeightOption = { label: 'Sin peso', value: null };

  if (!equipmentId || !inventory) {
    return [noWeightOption];
  }

  /** 1. Buscar en plateCombinations por apiFamilyIdentifier */
  const plateCombo = inventory.plateCombinations.find(
    (c) => c.apiFamilyIdentifier === equipmentId
  );
  if (plateCombo) {
    /** Si el equipo tiene peso base (ej: barra = 20 kg), lo muestra como primera opción */
    const firstOption: WeightOption = plateCombo.baseWeight > 0
      ? { label: `${plateCombo.baseWeight} kg (sin discos)`, value: plateCombo.baseWeight }
      : noWeightOption;
    return [
      firstOption,
      ...plateCombo.achievableWeights
        .filter((w) => w !== plateCombo.baseWeight)
        .map((w) => ({ label: `${w} kg`, value: w })),
    ];
  }

  /** 2. Mancuerna fija: usar dumbbellWeights */
  if (equipmentId === 'dumbbell' && inventory.dumbbellWeights.length > 0) {
    return [
      noWeightOption,
      ...inventory.dumbbellWeights.map((w) => ({
        label: `${w} kg`,
        value: w,
      })),
    ];
  }

  /** 3. Fallback: bodyweight / sin equipo de carga */
  return [noWeightOption];
};
