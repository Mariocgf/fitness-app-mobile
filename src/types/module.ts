/** Módulo activo del usuario, devuelto por GET /api/Modules/user/active */
export interface ActiveModule {
  name: string; // "Fitness" | "Health" | "Nutrition"
}
