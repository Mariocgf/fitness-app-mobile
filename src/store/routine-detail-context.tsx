/**
 * Contexto para comunicar el estado de la vista de detalle de rutina
 * entre HomeScreen y MyTabBar. Permite que el FAB del nav muestre
 * opciones contextuales cuando la rutina está expandida.
 */
import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

interface RoutineActions {
  onRegenerate: () => void;
  onChangeExercises: () => void;
}

interface RoutineDetailContextValue {
  isDetailVisible: boolean;
  setDetailVisible: (visible: boolean) => void;
  actions: RoutineActions | null;
  setActions: (actions: RoutineActions | null) => void;
}

const RoutineDetailContext = createContext<RoutineDetailContextValue>({
  isDetailVisible: false,
  setDetailVisible: () => {},
  actions: null,
  setActions: () => {},
});

export function RoutineDetailProvider({ children }: { children: React.ReactNode }) {
  const [isDetailVisible, setDetailVisible] = useState(false);
  const [actions, setActions] = useState<RoutineActions | null>(null);

  const value = useMemo(() => ({
    isDetailVisible,
    setDetailVisible,
    actions,
    setActions,
  }), [isDetailVisible, actions]);

  return (
    <RoutineDetailContext.Provider value={value}>
      {children}
    </RoutineDetailContext.Provider>
  );
}

export const useRoutineDetailContext = () => useContext(RoutineDetailContext);
