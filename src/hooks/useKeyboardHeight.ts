import { useEffect, useState } from 'react';
import { Keyboard, Platform } from 'react-native';

interface KeyboardState {
  isKeyboardVisible: boolean;
  /** Altura del teclado en px (incluye safe area en iOS). 0 si está oculto. */
  keyboardHeight: number;
}

/**
 * Observa el teclado y devuelve su altura. En iOS usa los eventos `Will` (acompañan la
 * animación de apertura); en Android usa `Did` (los `Will` no disparan de forma fiable).
 * Sirve para anclar una barra/input justo encima del teclado sin `KeyboardAvoidingView`.
 */
export function useKeyboardHeight(): KeyboardState {
  const [state, setState] = useState<KeyboardState>({ isKeyboardVisible: false, keyboardHeight: 0 });

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSub = Keyboard.addListener(showEvent, (e) => {
      setState({ isKeyboardVisible: true, keyboardHeight: e.endCoordinates?.height ?? 0 });
    });
    const hideSub = Keyboard.addListener(hideEvent, () => {
      setState({ isKeyboardVisible: false, keyboardHeight: 0 });
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  return state;
}
