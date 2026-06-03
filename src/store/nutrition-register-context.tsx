import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

interface NutritionRegisterContextValue {
  isRegisterViewVisible: boolean;
  canSave: boolean;
  isSaving: boolean;
  saveFoodsRef: React.MutableRefObject<() => Promise<void>>;
  setRegisterState: (state: RegisterState) => void;
}

const noopSave = async () => {};
const noopSetState = () => {};

interface RegisterState {
  isRegisterViewVisible: boolean;
  canSave: boolean;
  isSaving: boolean;
  onSave: () => Promise<void>;
}

const NutritionRegisterContext = createContext<NutritionRegisterContextValue>({
  isRegisterViewVisible: false,
  canSave: false,
  isSaving: false,
  saveFoodsRef: { current: noopSave },
  setRegisterState: noopSetState,
});

export function NutritionRegisterProvider({ children }: { children: React.ReactNode }) {
  const saveFoodsRef = useRef<() => Promise<void>>(noopSave);
  const [state, setState] = useState({
    isRegisterViewVisible: false,
    canSave: false,
    isSaving: false,
  });

  const setRegisterState = useCallback((nextState: RegisterState) => {
    saveFoodsRef.current = nextState.onSave;
    setState({
      isRegisterViewVisible: nextState.isRegisterViewVisible,
      canSave: nextState.canSave,
      isSaving: nextState.isSaving,
    });
  }, []);

  const value = useMemo<NutritionRegisterContextValue>(
    () => ({
      ...state,
      saveFoodsRef,
      setRegisterState,
    }),
    [setRegisterState, state],
  );

  return (
    <NutritionRegisterContext.Provider value={value}>
      {children}
    </NutritionRegisterContext.Provider>
  );
}

export function NutritionRegisterState({
  canSave,
  isSaving,
  onSave,
}: {
  canSave: boolean;
  isSaving: boolean;
  onSave: () => Promise<void>;
}) {
  const { setRegisterState } = useContext(NutritionRegisterContext);

  useEffect(() => {
    setRegisterState({
      isRegisterViewVisible: true,
      canSave,
      isSaving,
      onSave,
    });

    return () => {
      setRegisterState({
        isRegisterViewVisible: false,
        canSave: false,
        isSaving: false,
        onSave: noopSave,
      });
    };
  }, [canSave, isSaving, onSave, setRegisterState]);

  return null;
}

export const useNutritionRegisterContext = () => useContext(NutritionRegisterContext);
