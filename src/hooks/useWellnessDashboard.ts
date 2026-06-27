import { useAuth } from "@clerk/clerk-expo";
import { useCallback, useEffect, useRef, useState } from "react";

import {
  getHydrationLogs,
  getMeditationSessions,
  getMoodLogs,
  getSleepLogs,
} from "../services/wellness.service";
import {
  WellnessActivityItem,
  WellnessTodaySummary,
} from "../types/wellness";
import { getTodayDateKey } from "../utils/nutrition.utils";

// Página única que pedimos por feature: alcanza para el resumen de hoy + actividad reciente.
const PAGE_SIZE = 20;
// Cuántas entradas mostrar en "Actividad reciente" (merge de las 4 features).
const RECENT_LIMIT = 6;

interface UseWellnessDashboardReturn {
  today: WellnessTodaySummary;
  recentActivity: WellnessActivityItem[];
  isLoading: boolean;
  error: string | null;
  refresh: () => void;
}

const EMPTY_TODAY: WellnessTodaySummary = {
  sleep: null,
  hydrationMl: 0,
  mood: null,
  meditationMinutes: 0,
};

/**
 * Alimenta el dashboard de Bienestar: trae la primera página de las 4 features
 * en paralelo y arma el resumen "Hoy" + la lista de "Actividad reciente".
 * Sigue el patrón estable del módulo (getTokenRef, carga en mount, sin loops).
 */
export function useWellnessDashboard(): UseWellnessDashboardReturn {
  const { getToken } = useAuth();
  // Referencia estable para no incluir getToken como dep de efectos con setState.
  const getTokenRef = useRef(getToken);
  getTokenRef.current = getToken;

  const [today, setToday] = useState<WellnessTodaySummary>(EMPTY_TODAY);
  const [recentActivity, setRecentActivity] = useState<WellnessActivityItem[]>(
    [],
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const token = await getTokenRef.current();
      const [sleep, hydration, mood, meditation] = await Promise.all([
        getSleepLogs(token, 1, PAGE_SIZE),
        getHydrationLogs(token, 1, PAGE_SIZE),
        getMoodLogs(token, 1, PAGE_SIZE),
        getMeditationSessions(token, 1, PAGE_SIZE),
      ]);

      const todayKey = getTodayDateKey();

      // ── Resumen "Hoy" (los listados vienen descendentes: el primero es el más reciente) ──
      const todaySleep = sleep.items.find((s) => s.date === todayKey) ?? null;
      const todayMood = mood.items.find((m) => m.date === todayKey) ?? null;
      const hydrationMl = hydration.items
        .filter((h) => h.date === todayKey)
        .reduce((sum, h) => sum + h.amountMl, 0);
      const meditationMinutes = meditation.items
        .filter((m) => m.date === todayKey)
        .reduce((sum, m) => sum + m.durationMinutes, 0);

      setToday({
        sleep: todaySleep,
        hydrationMl,
        mood: todayMood,
        meditationMinutes,
      });

      // ── Actividad reciente: merge de las 4 features, ordenado por capturedAt desc ──
      const merged: WellnessActivityItem[] = [
        ...sleep.items.map(
          (data): WellnessActivityItem => ({
            kind: "sleep",
            id: data.id,
            capturedAt: data.capturedAt,
            date: data.date,
            data,
          }),
        ),
        ...hydration.items.map(
          (data): WellnessActivityItem => ({
            kind: "hydration",
            id: data.id,
            capturedAt: data.capturedAt,
            date: data.date,
            data,
          }),
        ),
        ...mood.items.map(
          (data): WellnessActivityItem => ({
            kind: "mood",
            id: data.id,
            capturedAt: data.capturedAt,
            date: data.date,
            data,
          }),
        ),
        ...meditation.items.map(
          (data): WellnessActivityItem => ({
            kind: "meditation",
            id: data.id,
            capturedAt: data.capturedAt,
            date: data.date,
            data,
          }),
        ),
      ];

      merged.sort((a, b) => b.capturedAt.localeCompare(a.capturedAt));
      setRecentActivity(merged.slice(0, RECENT_LIMIT));
    } catch {
      setError(
        "No pudimos cargar tu bienestar. Revisá tu conexión e intentá de nuevo.",
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Carga inicial al montar.
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { today, recentActivity, isLoading, error, refresh: load };
}
