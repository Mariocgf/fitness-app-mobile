# Dashboard de evolución física — Guía para Frontend

Este endpoint entrega los datos que el frontend necesita para graficar la evolución física del usuario: peso y perímetros corporales. No mezcla ejercicios, rutinas ni sesiones de entrenamiento; la fuente de verdad son las mediciones corporales registradas por el usuario.

## Quick path

1. Llamar `GET /api/health/body-measurements/dashboard` con el JWT del usuario.
2. Opcionalmente enviar `fromDate` y `toDate` en formato `YYYY-MM-DD`.
3. Renderizar una gráfica por cada item de `metrics`, usando `points` como serie temporal.

## Request

```http
GET /api/health/body-measurements/dashboard?fromDate=2026-01-01&toDate=2026-01-31
Authorization: Bearer <jwt>
```

### Query params

| Param | Tipo | Requerido | Formato | Descripción |
|-------|------|-----------|---------|-------------|
| `fromDate` | date | No | `YYYY-MM-DD` | Fecha mínima de las mediciones a incluir. |
| `toDate` | date | No | `YYYY-MM-DD` | Fecha máxima de las mediciones a incluir. |

Si no se envían filtros, el backend devuelve todo el historial disponible del usuario.

## Response `200`

```json
{
  "fromDate": "2026-01-01",
  "toDate": "2026-01-31",
  "metrics": [
    {
      "metric": "weightKg",
      "label": "Peso",
      "unit": "kg",
      "latestValue": 76,
      "absoluteChange": -4,
      "percentageChange": -5,
      "points": [
        {
          "date": "2026-01-01",
          "value": 80
        },
        {
          "date": "2026-01-15",
          "value": 76
        }
      ]
    }
  ]
}
```

### Campos principales

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `fromDate` | `string \| null` | Filtro inicial aplicado. |
| `toDate` | `string \| null` | Filtro final aplicado. |
| `metrics` | `BodyMetricTrend[]` | Series listas para renderizar gráficas. |

### `BodyMetricTrend`

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `metric` | string | Identificador estable para lógica frontend. |
| `label` | string | Texto visible recomendado. |
| `unit` | string | Unidad de la métrica: `kg` o `cm`. |
| `latestValue` | `number \| null` | Último valor disponible de esa métrica. |
| `absoluteChange` | `number \| null` | Diferencia entre último y primer valor disponible. |
| `percentageChange` | `number \| null` | Cambio porcentual entre último y primer valor disponible. |
| `points` | `{ date: string, value: number }[]` | Serie temporal ordenada ascendente por fecha. |

## Métricas disponibles

| `metric` | `label` | `unit` |
|----------|---------|--------|
| `weightKg` | Peso | kg |
| `waistCm` | Cintura | cm |
| `neckCm` | Cuello | cm |
| `hipCm` | Cadera | cm |
| `chestCm` | Pecho | cm |
| `armCm` | Brazo | cm |
| `forearmCm` | Antebrazo | cm |
| `thighCm` | Muslo | cm |
| `calfCm` | Pantorrilla | cm |

## Reglas importantes para UI

- Una métrica puede venir sin puntos: mostrar estado vacío para esa tarjeta/gráfica.
- Los valores `null` significan “sin datos suficientes”, no error.
- El backend omite puntos nulos por métrica. Ejemplo: si una medición tiene peso pero no cintura, suma punto a `weightKg` pero no a `waistCm`.
- `absoluteChange` puede ser negativo. Para peso y perímetros, negativo normalmente indica reducción.
- `percentageChange` se calcula contra el primer valor disponible de esa métrica dentro del rango consultado.
- Usar `metric` para lógica y `label` para mostrar texto. No hardcodear labels si se puede evitar.

## Errores esperables

| Status | Cuándo pasa | Acción frontend |
|--------|-------------|-----------------|
| `401` | Falta JWT o el token no identifica al usuario. | Redirigir a login o refrescar sesión. |
| `400` | `fromDate` es posterior a `toDate`. | Mostrar validación de rango de fechas. |

## Checklist frontend

- [ ] Enviar `Authorization: Bearer <jwt>`.
- [ ] Usar fechas `YYYY-MM-DD`.
- [ ] Renderizar `metrics[].points` como series temporales.
- [ ] Soportar métricas vacías.
- [ ] Mostrar `latestValue`, `absoluteChange` y `percentageChange` sólo si no son `null`.
- [ ] No mezclar estos datos con historial de ejercicios.
