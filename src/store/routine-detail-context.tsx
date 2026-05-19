/**
 * Contexto para comunicar el estado de la vista de detalle de rutina
 * entre HomeScreen y MyTabBar. Permite que el FAB del nav muestre
 * opciones contextuales cuando la rutina está expandida y cuando
 * está activo el modo de cambio de ejercicios.
 */
import React, { createContext, useContext, useMemo, useState } from 'react';

interface RoutineActions {
  onRegenerate: () => void;
  /** Activa el modo de selección para cambiar ejercicios. */
  onChangeExercises: () => void;
  /** Pide sugerencias para los ejercicios seleccionados. */
  onRequestSuggestions: (useAI: boolean) => void;
  /** Sale del modo de cambio sin aplicar nada. */
  onExitSwapMode: () => void;
}

interface RoutineDetailContextValue {
  isDetailVisible: boolean;
  setDetailVisible: (visible: boolean) => void;
  /** True cuando el usuario activó "Cambiar ejercicios" en la rutina. */
  isSwapMode: boolean;
  setSwapMode: (active: boolean) => void;
  actions: RoutineActions | null;
  setActions: (actions: RoutineActions | null) => void;
  /** Acción global para generar una rutina (se registra desde el index) */
  onGenerateRoutine: (() => void) | null;
  setOnGenerateRoutine: (action: (() => void) | null) => void;
}

const RoutineDetailContext = createContext<RoutineDetailContextValue>({
  isDetailVisible: false,
  setDetailVisible: () => {},
  isSwapMode: false,
  setSwapMode: () => {},
  actions: null,
  setActions: () => {},
  onGenerateRoutine: null,
  setOnGenerateRoutine: () => {},
});

export function RoutineDetailProvider({ children }: { children: React.ReactNode }) {
  const [isDetailVisible, setDetailVisible] = useState(false);
  const [isSwapMode, setSwapMode] = useState(false);
  const [actions, setActions] = useState<RoutineActions | null>(null);
  const [onGenerateRoutine, setOnGenerateRoutine] = useState<(() => void) | null>(null);

  const value = useMemo(() => ({
    isDetailVisible,
    setDetailVisible,
    isSwapMode,
    setSwapMode,
    actions,
    setActions,
    onGenerateRoutine,
    setOnGenerateRoutine,
  }), [isDetailVisible, isSwapMode, actions, onGenerateRoutine]);

  return (
    <RoutineDetailContext.Provider value={value}>
      {children}
    </RoutineDetailContext.Provider>
  );
}

export const useRoutineDetailContext = () => useContext(RoutineDetailContext);
