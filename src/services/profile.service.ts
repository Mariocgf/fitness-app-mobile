import apiClient from '../api/client';

// ── Tipos locales ──

export interface UserEquipmentItem {
  id: string;
  name: string;
  quantity: number;
}

export interface EquipmentUpdatePayload {
  equipmentItems: {
    equipmentId: string;
    quantity: number;
  }[];
}

// ── Tipos de Health y Nutrition ──
export interface UserHealthItem {
  id: string;
  name: string;
  severity?: string;
}

export interface UserNutritionItem {
  id: string;
  name: string;
}

// ── Fitness: Equipamiento del usuario ──

export const getUserEquipment = async (
  token: string | null
): Promise<UserEquipmentItem[]> => {
  const { data } = await apiClient.get<UserEquipmentItem[]>(
    '/api/Fitness/available-equipments',
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );
  return data;
};

export const updateUserEquipment = async (
  payload: EquipmentUpdatePayload,
  token: string | null
) => {
  const { data } = await apiClient.put(
    '/api/Fitness/available-equipments',
    payload,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );
  return data;
};

// ── Health: Lesiones y afecciones del usuario ──

export const getUserInjuries = async (
  token: string | null
): Promise<UserHealthItem[]> => {
  const { data } = await apiClient.get<UserHealthItem[]>(
    '/api/Health/user-injuries',
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );
  return data;
};

export const updateUserInjuries = async (
  injuryIds: string[],
  token: string | null
) => {
  const { data } = await apiClient.put(
    '/api/Health/user-injuries',
    { injuryIds },
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );
  return data;
};

export const getUserMedicalConditions = async (
  token: string | null
): Promise<UserHealthItem[]> => {
  const { data } = await apiClient.get<UserHealthItem[]>(
    '/api/Health/user-medical-conditions',
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );
  return data;
};

export const updateUserMedicalConditions = async (
  medicalConditionIds: string[],
  token: string | null
) => {
  const { data } = await apiClient.put(
    '/api/Health/user-medical-conditions',
    { medicalConditionIds },
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );
  return data;
};

// ── Nutrition: Restricciones alimenticias del usuario ──

export const getUserFoodAllergies = async (
  token: string | null
): Promise<UserNutritionItem[]> => {
  const { data } = await apiClient.get<UserNutritionItem[]>(
    '/api/Nutrition/user-food-allergies',
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );
  return data;
};

export const updateUserFoodAllergies = async (
  foodAllergyIds: string[],
  token: string | null
) => {
  const { data } = await apiClient.put(
    '/api/Nutrition/user-food-allergies',
    { foodAllergyIds },
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );
  return data;
};

export const getUserTypeOfDiets = async (
  token: string | null
): Promise<UserNutritionItem[]> => {
  const { data } = await apiClient.get<UserNutritionItem[]>(
    '/api/Nutrition/user-type-of-diets',
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );
  return data;
};

export const updateUserTypeOfDiets = async (
  typeOfDietIds: string[],
  token: string | null
) => {
  const { data } = await apiClient.put(
    '/api/Nutrition/user-type-of-diets',
    { typeOfDietIds },
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );
  return data;
};
