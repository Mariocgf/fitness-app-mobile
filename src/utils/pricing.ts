/**
 * Calcula el ahorro real del ciclo anual frente a pagar 12 meses sueltos.
 *
 * El porcentaje sale de los montos REALES del store (no de un número de marketing
 * hardcodeado): si el backend cambia los precios, el badge se ajusta solo. Devuelve
 * `null` cuando el dato no alcanza para afirmar nada —falta un precio, el anual no
 * conviene o el ahorro redondea a 0%—, y en ese caso el paywall no muestra badge.
 */
export const computeAnnualSavingsPercent = (
  monthlyAmount: number,
  annualAmount: number,
): number | null => {
  if (monthlyAmount <= 0 || annualAmount <= 0) return null;

  const twelveMonths = monthlyAmount * 12;
  if (annualAmount >= twelveMonths) return null;

  const percent = Math.round((1 - annualAmount / twelveMonths) * 100);
  return percent >= 1 ? percent : null;
};
