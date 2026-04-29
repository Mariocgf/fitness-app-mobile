export interface BasicInfoPayload {
  gender: string;
  birthDay: string;       // formato "YYYY-MM-DD" (DateOnly)
  heightCm: number;       // en centímetros
  weightKg: number;       // en kilogramos
  GlobalGoal: string;   // ID del objetivo seleccionado (dinámico)
}

export interface OnboardingDraft {
  birthDay?: string;
  gender?: string;
  heightCm?: number;
  weightKg?: number;
  GlobalGoal?: string;
  GlobalGoalName?: string;
  currentStep?: number;
}

export interface Module {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  brandColor: string;
}

export interface OnboardingStatusResponse {
  status: 'AWAITING_TERMS_ACCEPTANCE' | 'AWAITING_BASIC_DATA' | 'AWAITING_MODULE_SELECTION' | 'AWAITING_MODULE_CONFIG' | 'COMPLETED';
}
