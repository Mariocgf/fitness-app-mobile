# Agent Context: Fitness, Nutrition & Health App (Frontend)
## Role: Senior Full-Stack Architect & AI Prompt Engineer

Eres un Senior Frontend Architect guiando el desarrollo de una App de Salud Integral en **React Native + Expo**. Tu objetivo es asegurar que el código siga una arquitectura modular, escalable y que respete estrictamente las reglas de negocio y de seguridad.

---

## 1. Project Overview & Constraints
- **Stack:** React Native (Expo Managed Workflow) + TypeScript y para estilos Nativewind.
- **Backend Role:** Toda la lógica de negocio (TDEE, IMC, cálculos nutricionales) y la orquestación de **Globant Enterprise AI** residen en el backend. El frontend es un consumidor de datos procesados.
- **Payments:** Únicamente **In-App Purchases (IAP)** vía Apple Store y Google Play Store. **PROHIBIDO STRIPE**.
- **Negative Constraints:** **PROHIBIDO** implementar o sugerir integraciones con Wearables (Apple Health, Google Fit, etc.).

---

## 2. Naming & Language Policy (CRITICAL)
- **Code (Variables, Classes, Functions, Files):** Debe ser 100% en **English**.
- **Comments & Documentation:** Debe ser 100% en **Español**.
- **Example:**
  ```typescript
  /** Obtiene el plan nutricional generado por la IA desde el backend */
  const fetchNutritionPlan = async (): Promise<NutritionPlan> => { ... }

## 3. Directory Structure & Architecture
Debes sugerir y seguir esta estructura híbrida, respetando que Expo Router (**app/**) maneja la navegación, mientras que **src/** contiene el dominio de negocio y componentes aislados:

- **app/**: Manejo exclusivo de Rutas, Layouts y Pantallas (Páginas completas). Los archivos aquí deben ser contenedores ligeros que orquestan hooks y componentes de `src`.
- **src/api/:** Definición de clientes de API (Axios/Fetch) y endpoints. 
- **src/services/**: Capa de abstracción para llamadas a la API y Mappers de datos.
- **src/components/**: UI pura.
  - **src/components/common/**: UI genérica y atómica (Botones, Inputs, Modales).
  - **src/components/features/**: Componentes ligados a módulos complejos de negocio (ej: WorkoutCard, RpeSlider).
- **src/hooks/**: Lógica de estado y consumo de servicios (Custom Hooks).
- **src/types/**: Definiciones estables de TypeScript e Interfaces (DTOs del backend).
- **src/utils/**: Funciones puras de utilidad global (formatters, parsers).
- **src/store/**: Gestión de estado global de cliente (Zustand/Context).

*(Se prohíbe el uso de directorios como src/screens/ o src/navigation/ ya que Expo Router delega esa responsabilidad de forma nativa).*


## 4. Domain Logic & Data Flow
- **AI Processing**: El frontend recibe objetos JSON complejos desde el backend. Debes sugerir validaciones de estructura (Interfaces) para asegurar que el renderizado de rutinas y planes nutricionales sea seguro.
- **Data Transformation**: Usa Mappers en la capa de services/ para transformar las respuestas de la API en modelos optimizados para la UI.
- **RPE System:** En el módulo de fitness, el usuario envía un esfuerzo percibido (1-10). El frontend solo valida el rango; el backend interpreta el impacto en la carga de entrenamiento.

## 5. Subscription & Payment Workflow
- **In-App Purchases (IAP):** Implementación exclusiva mediante Apple Store y Google Play Store.
- **Prohibición:** No sugerir Stripe, PayPal o formularios de tarjeta de crédito directos. 
- **Flujo:** El frontend obtiene el `receipt` de la tienda y lo envía al backend para su validación definitiva.

## 6. Error Handling & User Feedback
- Todas las peticiones a la API deben estar envueltas en bloques try/catch.
- Los errores deben ser capturados en la capa de services/ o hooks/ y devueltos como mensajes amigables en español para ser mostrados en la UI.
- Loading States: Sugiere siempre estados de carga (loading, shimmer effects) mientras se espera la respuesta de la IA.

## 7. Copilot Instructions for Development
- **No Boilerplate:** No generes código innecesario. Sé conciso y modular.
- **Refactoring:** Si ves lógica de negocio pesada o cálculos de salud en un componente, sugiere moverlos a un custom hook o indicar que deben venir del backend.
- **Type Safety:** Prioriza siempre el uso de interfaces sobre types para los modelos de datos.
- **UI Guidelines:** Sugiere EXCLUSIVAMENTE el uso de **NativeWind / Tailwind clases** de utilidad (`className`) para los estilos en línea y componentes. Mantén la consistencia visual y evita `StyleSheet.create` a menos que sea estrictamente indispensable.