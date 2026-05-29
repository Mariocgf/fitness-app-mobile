/**
 * Contexto para comunicar el estado de la vista de detalle de rutina
 * entre HomeScreen y MyTabBar. Permite que el FAB del nav muestre
 * opciones contextuales cuando la rutina está expandida y cuando
 * está activo el modo de cambio de ejercicios.
 */
import { Routine } from '@/src/types/routine';
import React, { createContext, useContext, useMemo, useRef, useState } from 'react';

interface RoutineActions {
  onRegenerate: () => void;
  /** Activa el modo de selección para cambiar ejercicios. */
  onChangeExercises: () => void;
  /** Pide sugerencias para los ejercicios seleccionados. */
  onRequestSuggestions: (useAI: boolean) => void;
  /** Sale del modo de cambio sin aplicar nada. */
  onExitSwapMode: () => void;
  /** Edita la rutina (solo para rutinas manuales). */
  onEdit: (() => void) | null;
  /** Elimina la rutina. */
  onDelete: (() => void) | null;
  /** Activa la rutina como rutina activa del usuario. */
  onActivate: (() => void) | null;
  /** Adapta la rutina manual con IA */
  onAdaptRoutine: (() => void) | null;
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
  /** Acción para crear rutina manualmente (se registra desde fitness) */
  onCreateRoutine: (() => void) | null;
  setOnCreateRoutine: (action: (() => void) | null) => void;
  /** Rutina activa en memoria compartida entre tabs — evita fetches duplicados */
  activeRoutine: Routine | null;
  setActiveRoutine: (routine: Routine | null) => void;
  /** True cuando se está viendo específicamente la rutina activa (no otra rutina) */
  viewingActiveRoutine: boolean;
  setViewingActiveRoutine: (viewing: boolean) => void;
  /** True mientras CreateRoutineView está abierto en modo creación */
  isCreatingRoutine: boolean;
  setIsCreatingRoutine: (creating: boolean) => void;
  /** True mientras CreateRoutineView está abierto en modo edición */
  isEditingRoutine: boolean;
  setIsEditingRoutine: (editing: boolean) => void;
  /** Ref estable para guardar desde el FAB — siempre inicializado, nunca null por timing */
  saveRoutineRef: React.MutableRefObject<((activate: boolean) => void)>;
  /** Ref que indica si el formulario de rutina es válido (nombre + al menos 1 ejercicio) */
  isFormValidRef: React.MutableRefObject<boolean>;
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
  onCreateRoutine: null,
  setOnCreateRoutine: () => {},
  activeRoutine: null,
  setActiveRoutine: () => {},
  viewingActiveRoutine: false,
  setViewingActiveRoutine: () => {},
  isCreatingRoutine: false,
  setIsCreatingRoutine: () => {},
  isEditingRoutine: false,
  setIsEditingRoutine: () => {},
  saveRoutineRef: { current: () => {} },
  isFormValidRef: { current: false },
});

export function RoutineDetailProvider({ children }: { children: React.ReactNode }) {
  const [isDetailVisible, setDetailVisible] = useState(false);
  const [isSwapMode, setSwapMode] = useState(false);
  const [actions, setActions] = useState<RoutineActions | null>(null);
  const [onGenerateRoutine, setOnGenerateRoutine] = useState<(() => void) | null>(null);
  const [onCreateRoutine, setOnCreateRoutine] = useState<(() => void) | null>(null);
  const [activeRoutine, setActiveRoutine] = useState<Routine | null>(null);
  const [viewingActiveRoutine, setViewingActiveRoutine] = useState(false);
  const [isCreatingRoutine, setIsCreatingRoutine] = useState(false);
  const [isEditingRoutine, setIsEditingRoutine] = useState(false);
  const saveRoutineRef = useRef<(activate: boolean) => void>(() => {
    console.warn('[RoutineDetailContext] saveRoutineRef called but no handler registered');
  });
  const isFormValidRef = useRef<boolean>(false);

  const value = useMemo(() => ({
    isDetailVisible,
    setDetailVisible,
    isSwapMode,
    setSwapMode,
    actions,
    setActions,
    onGenerateRoutine,
    setOnGenerateRoutine,
    onCreateRoutine,
    setOnCreateRoutine,
    activeRoutine,
    setActiveRoutine,
    viewingActiveRoutine,
    setViewingActiveRoutine,
    isCreatingRoutine,
    setIsCreatingRoutine,
    isEditingRoutine,
    setIsEditingRoutine,
    saveRoutineRef,
    isFormValidRef,
  }), [isDetailVisible, isSwapMode, actions, onGenerateRoutine, onCreateRoutine, activeRoutine, viewingActiveRoutine, isCreatingRoutine, isEditingRoutine]);

  return (
    <RoutineDetailContext.Provider value={value}>
      {children}
    </RoutineDetailContext.Provider>
  );
}

export const useRoutineDetailContext = () => useContext(RoutineDetailContext);
