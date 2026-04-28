import React from 'react';
import { Dimensions, StyleSheet } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

const SCREEN_WIDTH = Dimensions.get('window').width;
const EDGE_THRESHOLD = 40; // Solo detecta si empieza a ≤40px del borde izquierdo
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.35; // 35% del ancho para activar

interface SwipeBackWrapperProps {
  /** Callback al completar el swipe hacia atrás */
  onSwipeBack: () => void;
  /** Contenido hijo */
  children: React.ReactNode;
}

/**
 * Envuelve una pantalla para habilitar navegación swipe-back
 * similar al gesto nativo de iOS (deslizar desde el borde izquierdo).
 */
export default function SwipeBackWrapper({
  onSwipeBack,
  children,
}: SwipeBackWrapperProps) {
  const translateX = useSharedValue(0);

  const panGesture = Gesture.Pan()
    .activeOffsetX([10, 1000]) // Solo permite swipe a la derecha
    .failOffsetY([-15, 15]) // Falla si el movimiento es vertical
    .onTouchesDown((event, manager) => {
      if (event.allTouches[0].x > EDGE_THRESHOLD) {
        manager.fail();
      }
    })
    .onStart(() => {
      translateX.value = 0;
    })
    .onUpdate((event) => {
      // Solo permitir desplazamiento hacia la derecha y desde el borde
      if (event.x - event.translationX <= EDGE_THRESHOLD && event.translationX > 0) {
        translateX.value = event.translationX;
      }
    })
    .onEnd((event) => {
      if (
        event.translationX > SWIPE_THRESHOLD &&
        event.x - event.translationX <= EDGE_THRESHOLD
      ) {
        // Completar la animación de salida
        translateX.value = withTiming(SCREEN_WIDTH, { duration: 200 }, () => {
          runOnJS(onSwipeBack)();
        });
      } else {
        // Volver a la posición original
        translateX.value = withTiming(0, { duration: 200 });
      }
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View style={[styles.container, animatedStyle]}>
        {children}
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
