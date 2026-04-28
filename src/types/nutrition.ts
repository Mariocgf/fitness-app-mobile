// ── Tipos del backend ──

export interface SubGoal {
  id: string;
  name: string;
  description: string;
}

export interface NutritionItem {
  id: string;
  name: string;
}

// ── Payload del POST ──

export interface NutritionProfilePayload {
  allergyIds: string[];
  dietaryPreferenceIds: string[];
  subGoals: string[];
}

// ── Draft local ──

export interface NutritionConfigDraft {
  selectedSubGoalIds?: string[];
  allergyIds?: string[];
  dietaryPreferenceIds?: string[];
}
