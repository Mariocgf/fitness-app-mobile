/**
 * Lista de ejercicios reordenable por arrastre — SOLO WEB.
 *
 * ¿Por qué no `DraggableFlatList` acá? Porque envuelve TODA la lista en un
 * `GestureDetector`, y RNGH le pone `touch-action: none` al div contenedor. Con eso el
 * navegador deja de scrollear y la lista queda congelada en la PWA. Ese fue el bug de
 * scroll que se arregló sacando el drag & drop de web.
 *
 * Acá se recupera el arrastre sin volver a romper el scroll, con el patrón que usan
 * dnd-kit y react-beautiful-dnd: `touch-action: none` va ACOTADO AL HANDLE, no al
 * contenedor. Un dedo que baja sobre el handle arrastra; un dedo que baja en cualquier
 * otro lado de la lista scrollea normalmente. Las dos cosas conviven.
 *
 * El arrastre se sigue con Pointer Events sobre `window` (no con RNGH): así funciona
 * igual con dedo y con mouse, y no compite con el `Swipeable` horizontal de la card.
 *
 * Durante el arrastre NADA se reordena: la card agarrada se traslada y una línea lima
 * marca dónde va a caer. El reordenamiento se aplica UNA sola vez, al soltar. Eso
 * mantiene válidas las alturas medidas mientras dura el gesto.
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { LayoutChangeEvent, ScrollView, StyleProp, View, ViewStyle } from 'react-native';

/** Separación entre cards (el `mb-3` de EditExerciseCard). */
const CARD_GAP = 12;

/** Franja del borde de la lista que dispara el auto-scroll mientras se arrastra. */
const AUTOSCROLL_EDGE = 72;

/** Píxeles por frame máximos del auto-scroll. */
const AUTOSCROLL_MAX_SPEED = 14;

/**
 * `touchAction` y `cursor` no existen en los tipos de RN, pero react-native-web SÍ los
 * aplica (los usa internamente en Pressable/ScrollView). El cast es el precio de usar
 * una prop de CSS que RN no tipa.
 */
const HANDLE_STYLE = {
  touchAction: 'none',
  cursor: 'grab',
  paddingVertical: 6,
  paddingHorizontal: 2,
} as unknown as ViewStyle;

interface SortableItem {
  id: string;
}

interface WebSortableExerciseListProps<T extends SortableItem> {
  data: T[];
  /** Se llama UNA vez al soltar, con el array ya reordenado. */
  onReorder: (next: T[]) => void;
  /**
   * `dragHandleProps` hay que spreadearlo en el handle de arrastre de la card.
   * `isDragging` es `true` solo para la card agarrada.
   */
  renderItem: (
    item: T,
    index: number,
    dragHandleProps: object,
    isDragging: boolean,
  ) => React.ReactNode;
  contentContainerStyle?: StyleProp<ViewStyle>;
  ListFooterComponent?: React.ReactNode;
}

export function WebSortableExerciseList<T extends SortableItem>({
  data,
  onReorder,
  renderItem,
  contentContainerStyle,
  ListFooterComponent,
}: WebSortableExerciseListProps<T>) {
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [targetIndex, setTargetIndex] = useState<number | null>(null);
  const [offset, setOffset] = useState(0);

  const scrollRef = useRef<ScrollView>(null);
  /**
   * Alto real de cada fila, incluido el margen inferior de la card.
   *
   * Va indexado POR ID y no por posición: al reordenar o cambiar de día los índices se
   * corren, y una tabla por índice quedaría apuntando a alturas de otras cards.
   */
  const heightsRef = useRef<Record<string, number>>({});
  const pointerYRef = useRef(0);
  const startPointerYRef = useRef(0);
  const startScrollRef = useRef(0);
  const rafRef = useRef<number | null>(null);

  /* Espejos en ref: los listeners de `window` viven en un closure y necesitan el
     valor fresco, no el capturado en el render donde arrancó el drag. */
  const dragIndexRef = useRef<number | null>(null);
  const targetIndexRef = useRef<number | null>(null);
  const dataRef = useRef(data);
  dataRef.current = data;
  const onReorderRef = useRef(onReorder);
  onReorderRef.current = onReorder;

  /** Nodo DOM scrolleable del ScrollView (web-only, de ahí el acceso destipado). */
  const getScrollNode = useCallback((): HTMLElement | null => {
    const scrollView = scrollRef.current as unknown as
      | { getScrollableNode?: () => HTMLElement }
      | null;
    return scrollView?.getScrollableNode?.() ?? null;
  }, []);

  /**
   * Índice donde caería la card según cuánto se arrastró.
   *
   * Se cruza una fila cuando el desplazamiento supera la MITAD de su alto; para cruzar
   * la siguiente hay que sumar además el alto completo de la anterior. Trabaja solo con
   * altos relativos, así que no hace falta convertir coordenadas de viewport a contenido.
   */
  const computeTarget = useCallback((from: number, delta: number): number => {
    const items = dataRef.current;
    const heightAt = (i: number) => heightsRef.current[items[i]?.id] ?? 0;
    let target = from;
    let accumulated = 0;

    if (delta > 0) {
      for (let i = from + 1; i < items.length; i++) {
        const height = heightAt(i);
        if (delta <= accumulated + height / 2) break;
        target = i;
        accumulated += height;
      }
    } else if (delta < 0) {
      for (let i = from - 1; i >= 0; i--) {
        const height = heightAt(i);
        if (-delta <= accumulated + height / 2) break;
        target = i;
        accumulated += height;
      }
    }

    return target;
  }, []);

  /**
   * Recalcula traslación y destino.
   *
   * El puntero está en coordenadas de viewport y la card en coordenadas de contenido:
   * por eso al delta del dedo hay que SUMARLE lo que scrolleó el contenedor desde que
   * arrancó el gesto. Sin eso, el auto-scroll desincroniza la card del dedo.
   */
  const syncDrag = useCallback(() => {
    const from = dragIndexRef.current;
    if (from === null) return;

    const node = getScrollNode();
    const scrolled = node ? node.scrollTop - startScrollRef.current : 0;
    const delta = pointerYRef.current - startPointerYRef.current + scrolled;

    setOffset(delta);
    const next = computeTarget(from, delta);
    targetIndexRef.current = next;
    setTargetIndex(next);
  }, [computeTarget, getScrollNode]);

  const endDrag = useCallback(() => {
    const from = dragIndexRef.current;
    const to = targetIndexRef.current;

    if (from !== null && to !== null && to !== from) {
      const next = [...dataRef.current];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      onReorderRef.current(next);
    }

    dragIndexRef.current = null;
    targetIndexRef.current = null;
    setDragIndex(null);
    setTargetIndex(null);
    setOffset(0);
  }, []);

  /* Seguimiento del gesto + auto-scroll, activos solo mientras se arrastra. */
  useEffect(() => {
    if (dragIndex === null) return;

    const handleMove = (event: PointerEvent) => {
      pointerYRef.current = event.clientY;
      syncDrag();
    };

    const step = () => {
      const node = getScrollNode();
      if (node) {
        const rect = node.getBoundingClientRect();
        const y = pointerYRef.current;

        let speed = 0;
        if (y < rect.top + AUTOSCROLL_EDGE) {
          speed = -Math.min(AUTOSCROLL_MAX_SPEED, Math.ceil((rect.top + AUTOSCROLL_EDGE - y) / 5));
        } else if (y > rect.bottom - AUTOSCROLL_EDGE) {
          speed = Math.min(AUTOSCROLL_MAX_SPEED, Math.ceil((y - (rect.bottom - AUTOSCROLL_EDGE)) / 5));
        }

        if (speed !== 0) {
          const before = node.scrollTop;
          const max = Math.max(0, node.scrollHeight - node.clientHeight);
          node.scrollTop = Math.max(0, Math.min(max, before + speed));
          if (node.scrollTop !== before) syncDrag();
        }
      }
      rafRef.current = requestAnimationFrame(step);
    };

    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', endDrag);
    window.addEventListener('pointercancel', endDrag);
    rafRef.current = requestAnimationFrame(step);

    return () => {
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', endDrag);
      window.removeEventListener('pointercancel', endDrag);
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
  }, [dragIndex, endDrag, getScrollNode, syncDrag]);

  const makeHandleProps = (index: number) => ({
    style: HANDLE_STYLE,
    onPointerDown: (event: { nativeEvent?: { clientY?: number }; clientY?: number }) => {
      const clientY = event.nativeEvent?.clientY ?? event.clientY ?? 0;

      startPointerYRef.current = clientY;
      pointerYRef.current = clientY;
      startScrollRef.current = getScrollNode()?.scrollTop ?? 0;

      dragIndexRef.current = index;
      targetIndexRef.current = index;
      setDragIndex(index);
      setTargetIndex(index);
      setOffset(0);
    },
  });

  const handleRowLayout = (id: string) => (event: LayoutChangeEvent) => {
    heightsRef.current[id] = event.nativeEvent.layout.height;
  };

  return (
    <ScrollView
      ref={scrollRef}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={contentContainerStyle}
    >
      {data.map((item, index) => {
        const isDragging = dragIndex === index;
        const showTarget = dragIndex !== null && targetIndex === index && targetIndex !== dragIndex;
        /* Cae DESPUÉS de la fila destino si bajó, ANTES si subió (así queda el splice). */
        const lineBelow = showTarget && (targetIndex as number) > (dragIndex as number);

        return (
          <View
            key={item.id}
            onLayout={handleRowLayout(item.id)}
            style={
              isDragging
                ? { transform: [{ translateY: offset }], zIndex: 10, opacity: 0.92 }
                : undefined
            }
          >
            {/* Indicador de destino. Va absoluto A PROPÓSITO: si ocupara espacio
                cambiaría los altos medidos en pleno gesto y el cálculo se iría. */}
            {showTarget && (
              <View
                pointerEvents="none"
                style={{
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  [lineBelow ? 'bottom' : 'top']: lineBelow ? CARD_GAP / 2 : -CARD_GAP / 2,
                  height: 3,
                  borderRadius: 2,
                  backgroundColor: '#a3e635',
                  zIndex: 20,
                }}
              />
            )}
            {renderItem(item, index, makeHandleProps(index), isDragging)}
          </View>
        );
      })}
      {ListFooterComponent}
    </ScrollView>
  );
}
