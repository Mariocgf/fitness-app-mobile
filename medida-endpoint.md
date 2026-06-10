Contrato del endpoint

GET /api/health/body-measurements/{id}

Autenticación: Bearer token (Clerk JWT) — obligatorio.

Path parameter:

┌───────┬──────┬────────────────────────────┐
│ Param │ Tipo │        Descripción         │
├───────┼──────┼────────────────────────────┤
│ id    │ uuid │ ID de la medición corporal │
└───────┴──────┴────────────────────────────┘

Response 200 — BodyMeasurementDto:

{
  "id": "3fa85f64-5717-4562-b3fc-2c963f66af
  "date": "2026-06-10",
  "capturedAt": "2026-06-10T14:30:00Z",
  "weightKg": 78.5,
  "waistCm": 82.0,
  "neckCm": 38.5,
  "hipCm": 95.0,
  "chestCm": 100.0,
  "armCm": 35.0,
  "forearmCm": 28.0,
  "thighCm": 55.0,
  "calfCm": 38.0,
  "bodyFatPercentage": 18.5,
  "leanMassKg": 64.0
}

Todos los campos de medición son number | null — el usuario puede haber registrado solo algunos.

Respuestas de error:

┌────────┬──────────────────────────────────┐
│ Status │                            Cuándo                             │
├────────┼───────────────────────────────────────────────────────────────┤
│ 401    │ Sin token o token inválido                                    │
├────────┼──────────────────────────────────┤
│ 404    │ La medición no existe, o existe pero pertenece a otro usuario │
└────────┴───────────────────────────────────────────────────────────────┘

▎ El 404 cubre ambos casos intencionalmentete pero es ajeno.