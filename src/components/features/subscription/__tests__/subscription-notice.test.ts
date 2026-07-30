import { buildSubscriptionNotice } from '../subscription-notice';
import { SubscriptionStatusValue } from '@/src/types/subscription';

const PERIOD_END = '4 dic 2026';

describe('buildSubscriptionNotice', () => {
  // ── Período de gracia: el caso que motivó todo ──

  describe('período de gracia (conserva el plan)', () => {
    it('avisa del cobro fallido con la fecha límite', () => {
      const notice = buildSubscriptionNotice('graceperiod', true, true, PERIOD_END);

      expect(notice).not.toBeNull();
      expect(notice!.tone).toBe('warning');
      expect(notice!.title).toBe('No pudimos cobrar tu suscripción');
      // La fecha es lo accionable: sin ella el usuario no sabe cuánto tiempo tiene.
      expect(notice!.body).toContain(PERIOD_END);
      expect(notice!.body).toContain('no perder tu plan');
    });

    it('avisa igual si no vino la fecha, sin inventar una', () => {
      const notice = buildSubscriptionNotice('graceperiod', true, true, null);

      expect(notice!.tone).toBe('warning');
      expect(notice!.body).toBe('Actualizá tu medio de pago para no perder tu plan.');
      expect(notice!.body).not.toContain('undefined');
      expect(notice!.body).not.toContain('null');
    });

    it('usa tono de advertencia, no de peligro: todavía no perdió nada', () => {
      expect(buildSubscriptionNotice('graceperiod', true, true, PERIOD_END)!.tone).toBe('warning');
    });
  });

  // ── Billing retry: mismo problema, otra urgencia ──

  describe('billing retry (ya perdió el plan)', () => {
    it('sube a tono de peligro y ofrece recuperarlo', () => {
      const notice = buildSubscriptionNotice('billingretry', false, true, null);

      expect(notice!.tone).toBe('danger');
      expect(notice!.title).toBe('Perdiste el acceso a tu plan');
      expect(notice!.body).toContain('recuperarlo');
    });

    it('se distingue de la gracia SOLO por hasAccess', () => {
      const enGracia = buildSubscriptionNotice('graceperiod', true, true, PERIOD_END);
      const sinAcceso = buildSubscriptionNotice('billingretry', false, true, PERIOD_END);

      expect(enGracia!.tone).not.toBe(sinAcceso!.tone);
      expect(enGracia!.title).not.toBe(sinAcceso!.title);
    });

    it.each<SubscriptionStatusValue>(['graceperiod', 'billingretry'])(
      'avisa en "%s" aunque requiresPaymentUpdate llegue en false',
      (status) => {
        // Defensa en profundidad: el aviso de cobro fallido es el más caro de perder, así que no
        // depende de que dos campos del backend estén sincronizados.
        const notice = buildSubscriptionNotice(status, status === 'graceperiod', false, PERIOD_END);

        expect(notice).not.toBeNull();
        expect(notice!.body).toContain('medio de pago');
      },
    );
  });

  // ── Resto de los estados ──

  describe('cancelada', () => {
    it('aclara hasta cuándo mantiene el plan', () => {
      const notice = buildSubscriptionNotice('cancelled', true, false, PERIOD_END);

      expect(notice!.tone).toBe('warning');
      expect(notice!.body).toContain(PERIOD_END);
      expect(notice!.body).toContain('Mantenés tu plan');
    });

    it('no rompe el mensaje cuando falta la fecha', () => {
      const notice = buildSubscriptionNotice('cancelled', true, false, null);

      expect(notice!.body).toBe('Mantenés tu plan hasta que termine el período actual.');
    });

    it('no pide actualizar el pago: no hay nada roto', () => {
      const notice = buildSubscriptionNotice('cancelled', true, false, PERIOD_END);

      expect(notice!.body).not.toContain('medio de pago');
    });
  });

  it.each<[SubscriptionStatusValue, 'warning' | 'danger']>([
    ['paused', 'warning'],
    ['expired', 'warning'],
    ['pending', 'warning'],
    ['refunded', 'danger'],
    ['revoked', 'danger'],
  ])('devuelve un aviso para "%s" con tono %s', (status, expectedTone) => {
    const notice = buildSubscriptionNotice(status, false, false, null);

    expect(notice).not.toBeNull();
    expect(notice!.tone).toBe(expectedTone);
    expect(notice!.title.length).toBeGreaterThan(0);
    expect(notice!.body.length).toBeGreaterThan(0);
  });

  // ── Silencio: cuando NO hay que molestar al usuario ──

  describe('sin aviso', () => {
    it('no muestra nada con la suscripción activa', () => {
      expect(buildSubscriptionNotice('active', true, false, PERIOD_END)).toBeNull();
    });

    it('no muestra nada si el usuario nunca compró', () => {
      expect(buildSubscriptionNotice('none', false, false, null)).toBeNull();
    });
  });

  // ── Cobertura total: ningún estado puede quedar sin decidir ──

  it('cubre TODOS los estados del backend sin caer en un default silencioso', () => {
    const todos: SubscriptionStatusValue[] = [
      'active',
      'graceperiod',
      'cancelled',
      'billingretry',
      'paused',
      'pending',
      'expired',
      'refunded',
      'revoked',
      'invalid',
      'none',
    ];

    // Estados donde el silencio es la respuesta correcta.
    const sinAviso: SubscriptionStatusValue[] = ['active', 'none', 'invalid'];

    todos.forEach((status) => {
      const hasAccess = status === 'active';
      const notice = buildSubscriptionNotice(status, hasAccess, false, PERIOD_END);

      if (sinAviso.includes(status)) {
        expect(notice).toBeNull();
      } else {
        expect(notice).not.toBeNull();
      }
    });
  });
});
