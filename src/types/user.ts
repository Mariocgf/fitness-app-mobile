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

/** Estado de configuración de un módulo activo, tal como lo reporta el backend. */
export interface OnboardingModuleStatus {
  moduleId: string;
  name: string;
  onboardingCompleted: boolean;
}

export interface OnboardingStatusResponse {
  status:
    | 'AWAITING_TERMS_ACCEPTANCE'
    // El backend envía este valor con typo (falta la "I"); matchear tal cual.
    | 'AWAITNG_TERMS_ACCEPTANCE'
    | 'AWAITING_BASIC_DATA'
    | 'AWAITING_MODULE_SELECTION'
    | 'AWAITING_MODULE_CONFIG'
    | 'COMPLETED';
  /**
   * Módulos activos del usuario con su estado de configuración.
   * Solo viene poblado en `AWAITING_MODULE_CONFIG` y `COMPLETED`; en las fases
   * anteriores llega como lista vacía.
   */
  modules: OnboardingModuleStatus[];
}
