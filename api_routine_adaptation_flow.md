# Guía de Integración: Adaptación de Rutinas Manuales con IA

Esta guía detalla el flujo de interacción y las especificaciones de API para la funcionalidad de **Adaptación de Rutinas Manuales mediante IA**, implementada con un flujo en dos pasos (*RoutineScientist* para detección y diagnóstico, y *RoutineOptimizer* para optimización y generación de la nueva propuesta).

---

## 1. El Flujo de Interacción del Frontend

El flujo se divide en tres etapas fundamentales desde la perspectiva del usuario:

```mermaid
graph TD
    A[Inicio: Usuario solicita adaptar rutina] --> B[POST /api/routine/{routineId}/adapt-ai]
    B --> C{¿HasChanges?}
    C -- False --> D[Mostrar mensaje: 'Tu rutina no requiere ajustes' + Preview]
    C -- True --> E[Mostrar comparador de cambios y motivos de reemplazo]
    E --> F{¿Confirmar o Rechazar?}
    F -- Confirmar --> G[POST /api/routine/adaptation/{adaptationId}/confirm]
    G --> H[Actualizar vista con la rutina adaptada finalizada]
    F -- Rechazar --> I[POST /api/routine/adaptation/{adaptationId}/reject]
    I --> J[Volver a la vista de la rutina original]
```

1. **Solicitud de Adaptación**: El frontend inicia el flujo llamando al endpoint `/adapt-ai`. La IA analiza la rutina contra las condiciones de salud del usuario.
2. **Previsualización de Cambios (Preview)**:
   - Si `HasChanges` es `true`: Se creó una propuesta temporal de adaptación en base de datos. Se le muestran al usuario los días adaptados y la lista de motivos (`Motives`) por los cuales se sugiere cambiar ciertos ejercicios.
   - Si `HasChanges` es `false`: No se creó ninguna adaptación pendiente en la BD. Se muestran los días tal cual y un mensaje indicando que la rutina está óptima.
3. **Decisión del Usuario**:
   - **Confirmar**: Se llama a `/confirm`. El Backend sobreescribe la rutina original con la versión adaptada y elimina el registro temporal.
   - **Rechazar**: Se llama a `/reject`. El Backend elimina el registro temporal de adaptación y la rutina original queda intacta.

---

## 2. Detalle de Endpoints de la API

> [!IMPORTANT]  
> Todos los endpoints requieren que se envíe el token JWT de Clerk en el header `Authorization: Bearer <TOKEN>`. La API recupera internamente el ID del usuario del token.

### Endpoint 1: Iniciar Adaptación con IA
Genera la propuesta de adaptación temporal y devuelve los detalles para la previsualización en el frontend.

* **URL**: `/api/routine/{routineId}/adapt-ai`
* **Método**: `POST`
* **Parámetros de Ruta**:
  * `routineId` (Guid, Requerido): El identificador de la rutina manual que se desea adaptar.
* **Request Body**: *Vacío*
* **Códigos de Respuesta**:
  * `200 OK`: Propuesta generada correctamente. Devuelve un `AdaptRoutineResponseDto`.
  * `401 Unauthorized`: Token de autenticación ausente o inválido.
  * `404 Not Found`: No se encontró la rutina o no pertenece al usuario autenticado.

#### Payload de Respuesta (`200 OK`)
```json
{
  "pendingAdaptationId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "hasChanges": true,
  "days": [
    {
      "dayOfWeek": "Monday",
      "approxTimeSession": 45,
      "exercises": [
        {
          "exerciseId": "ex-1234",
          "name": "Prensa de Pecho Inclinada con Mancuernas",
          "gifUrl": "https://media.giphy.com/...",
          "targetMuscles": ["Chest", "Triceps"],
          "order": 1,
          "sets": 4,
          "repType": "Reps",
          "minRep": 8,
          "maxRep": 12,
          "durationSeconds": null,
          "rest": 90,
          "weight": "20kg"
        }
      ]
    }
  ],
  "motives": [
    {
      "exerciseId": "ex-9999",
      "exerciseName": "Press de Banca Plano con Barra",
      "reason": "El press de banca plano convencional ejerce excesiva tensión sobre la articulación del hombro. Se reemplaza por Prensa de Pecho Inclinada con Mancuernas para reducir el estrés articular manteniendo el estímulo en el pectoral."
    }
  ]
}
```
> [!NOTE]  
> Si `hasChanges` es `false`, `pendingAdaptationId` vendrá como `null` y el arreglo `motives` estará vacío. En ese escenario, no debés llamar a `/confirm` ni a `/reject` puesto que no se persistió nada temporal en el backend.

---

### Endpoint 2: Confirmar Adaptación Propuesta
Aplica definitivamente la propuesta de adaptación a la rutina original del usuario.

* **URL**: `/api/routine/adaptation/{adaptationId}/confirm`
* **Método**: `POST`
* **Parámetros de Ruta**:
  * `adaptationId` (Guid, Requerido): El identificador de la adaptación temporal devuelto en el endpoint anterior (`pendingAdaptationId`).
* **Request Body**: *Vacío*
* **Códigos de Respuesta**:
  * `200 OK`: Adaptación confirmada y aplicada. Devuelve la estructura final de la rutina adaptada (`RoutineResponseDto`).
  * `401 Unauthorized`: Token de autenticación ausente o inválido.
  * `404 Not Found`: No existe la adaptación pendiente o no corresponde al usuario autenticado.

#### Payload de Respuesta (`200 OK`)
Devuelve el DTO estándar de la rutina modificada para que puedas renderizarla inmediatamente.
```json
{
  "id": "c7b5b546-eb0d-45db-b952-44675e01b17b",
  "name": "Mi Rutina Manual Adaptada",
  "source": "Manual",
  "isActive": true,
  "createdAt": "2026-05-29T12:00:00Z",
  "days": [
    {
      "id": "a90a2c53-43ef-4e35-ae6c-843f7b0e1451",
      "day": "Monday",
      "approxTimeSession": 45,
      "exercises": [
        {
          "id": "f5f590b1-8461-4de2-9ad2-54b9d0739bb2",
          "exerciseId": "ex-1234",
          "order": 1,
          "name": "Prensa de Pecho Inclinada con Mancuernas",
          "gifUrl": "https://media.giphy.com/...",
          "sets": 4,
          "repType": "Reps",
          "minRep": 8,
          "maxRep": 12,
          "currentRep": null,
          "durationSeconds": null,
          "rest": 90,
          "weight": "20kg"
        }
      ]
    }
  ]
}
```

---

### Endpoint 3: Rechazar Adaptación Propuesta
Descarta la propuesta de adaptación y limpia la base de datos de registros temporales.

* **URL**: `/api/routine/adaptation/{adaptationId}/reject`
* **Método**: `POST`
* **Parámetros de Ruta**:
  * `adaptationId` (Guid, Requerido): El identificador de la adaptación temporal (`pendingAdaptationId`).
* **Request Body**: *Vacío*
* **Códigos de Respuesta**:
  * `204 No Content`: Adaptación descartada y eliminada con éxito.
  * `401 Unauthorized`: Token de autenticación ausente o inválido.
  * `404 Not Found`: No existe la adaptación pendiente o no corresponde al usuario.
