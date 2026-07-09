import { logger } from '@/src/utils/logger';
import { useAuth } from '@clerk/clerk-expo';
import { useCallback, useEffect, useRef, useState } from 'react';

import {
  getInjuries,
  getMedicalConditions,
  getUserMedicalConditions,
  setMedicalConditionAiConsent,
} from '../services/health.service';
import {
  getUserInjuries,
  updateUserInjuries,
  updateUserMedicalConditions,
  UserHealthItem,
} from '../services/profile.service';
import { Injury, MedicalCondition } from '../types/health';

interface UseHealthInlineEditorReturn {
  injuries: Injury[];
  conditions: MedicalCondition[];
  injuryIds: string[];
  setInjuryIds: (ids: string[]) => void;
  /** Solo las condiciones habilitadas para IA (las que considera la rutina). */
  conditionIds: string[];
  setConditionIds: (ids: string[]) => void;
  isLoading: boolean;
  /**
   * Persiste los cambios ANTES de generar (el backend lee del perfil):
   * - Lesiones: reemplazo simple de la lista.
   * - Condiciones: NO destructivo. Agrega al perfil las nuevas sin quitar las
   *   existentes y maneja el consentimiento de IA (habilita las elegidas,
   *   deshabilita las quitadas). Una condición se "muestra" según su consentimiento,
   *   no según su membresía en el perfil.
   */
  persist: () => Promise<void>;
}

const hasDiff = (current: string[], initial: string[]): boolean =>
  current.length !== initial.length || current.some((id) => !initial.includes(id));

/**
 * Editor inline de lesiones y condiciones médicas para el modal de generación de
 * rutina. Reusa los endpoints de la configuración de Perfil. Para condiciones, la
 * fuente de verdad de "qué considera la rutina" es el consentimiento de IA
 * (`allowAiUsage`), no la membresía en el perfil: por eso arranca mostrando solo
 * las aprobadas y al guardar no borra las no aprobadas.
 */
export function useHealthInlineEditor(): UseHealthInlineEditorReturn {
  const { getToken } = useAuth();
  const getTokenRef = useRef(getToken);
  getTokenRef.current = getToken;

  const [injuries, setInjuries] = useState<Injury[]>([]);
  const [conditions, setConditions] = useState<MedicalCondition[]>([]);
  const [injuryIds, setInjuryIds] = useState<string[]>([]);
  const [conditionIds, setConditionIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const initialInjuryIds = useRef<string[]>([]);
  /** Condiciones aprobadas para IA al abrir (base para diffear consentimiento). */
  const initialApprovedConditionIds = useRef<string[]>([]);
  /** Todas las condiciones del perfil (aprobadas o no); base para no borrar en el PUT. */
  const allUserConditionIds = useRef<string[]>([]);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const token = await getTokenRef.current();
        const [catInjuries, userInjuries, catConditions, userConditions] = await Promise.all([
          getInjuries(token),
          getUserInjuries(token),
          getMedicalConditions(token),
          getUserMedicalConditions(token), // health.service → incluye allowAiUsage
        ]);
        if (!active) return;
        setInjuries(catInjuries);
        setConditions(catConditions);

        const injIds = userInjuries.map((i: UserHealthItem) => i.id);
        setInjuryIds(injIds);
        initialInjuryIds.current = injIds;

        const approvedIds = userConditions.filter((c) => c.allowAiUsage).map((c) => c.id);
        const allIds = userConditions.map((c) => c.id);
        setConditionIds(approvedIds);
        initialApprovedConditionIds.current = approvedIds;
        allUserConditionIds.current = allIds;
      } catch (e) {
        logger.error('[useHealthInlineEditor] Error cargando datos de salud:', e);
      } finally {
        if (active) setIsLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const persist = useCallback(async () => {
    const token = await getTokenRef.current();

    if (hasDiff(injuryIds, initialInjuryIds.current)) {
      await updateUserInjuries(injuryIds, token);
      initialInjuryIds.current = [...injuryIds];
    }

    const approvedInitial = initialApprovedConditionIds.current;
    if (hasDiff(conditionIds, approvedInitial)) {
      // 1. Agregar al perfil las condiciones nuevas SIN quitar las existentes.
      const brandNew = conditionIds.filter((id) => !allUserConditionIds.current.includes(id));
      if (brandNew.length > 0) {
        const merged = Array.from(new Set([...allUserConditionIds.current, ...conditionIds]));
        await updateUserMedicalConditions(merged, token);
        allUserConditionIds.current = merged;
      }
      // 2. Consentimiento de IA: habilitar las recién elegidas, deshabilitar las quitadas.
      const toEnable = conditionIds.filter((id) => !approvedInitial.includes(id));
      const toDisable = approvedInitial.filter((id) => !conditionIds.includes(id));
      await Promise.all([
        ...toEnable.map((id) => setMedicalConditionAiConsent(id, true, token)),
        ...toDisable.map((id) => setMedicalConditionAiConsent(id, false, token)),
      ]);
      initialApprovedConditionIds.current = [...conditionIds];
    }
  }, [injuryIds, conditionIds]);

  return {
    injuries,
    conditions,
    injuryIds,
    setInjuryIds,
    conditionIds,
    setConditionIds,
    isLoading,
    persist,
  };
}
