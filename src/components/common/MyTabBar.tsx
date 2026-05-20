import { useColorScheme } from '@/src/hooks/use-color-scheme';
import { useRoutineDetailContext } from '@/src/store/routine-detail-context';
import { Ionicons } from '@expo/vector-icons';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import * as Haptics from 'expo-haptics';
import { useCallback, useState } from 'react';
import { Modal, Platform, Pressable, Text, View } from 'react-native';
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// ─── Tipos ───────────────────────────────────────────────────────────────────

interface TabRoute {
  route: { key: string; name: string; params?: object };
  originalIndex: number;
}

interface MenuOption {
  icon: string;
  label: string;
  key: string;
}

// ─── Constantes ──────────────────────────────────────────────────────────────

/** Iconos por tab (outline = inactivo, filled = activo) */
const TAB_ICONS: Record<string, { outline: string; filled: string }> = {
  index:     { outline: 'home-outline',      filled: 'home' },
  fitness:   { outline: 'barbell-outline',   filled: 'barbell' },
  nutrition: { outline: 'nutrition-outline', filled: 'nutrition' },
  health:    { outline: 'heart-outline',     filled: 'heart' },
};

/** Opciones del menú contextual del botón central según la vista activa */
const FAB_MENU_OPTIONS: Record<string, MenuOption[]> = {
  index: [
    { icon: 'sparkles',          label: 'Generar rutina',     key: 'generate-routine' },
    { icon: 'add-circle-outline', label: 'Agregar actividad', key: 'add-activity' },
  ],
  fitness: [
    { icon: 'add-circle-outline', label: 'Nuevo ejercicio',  key: 'new-exercise' },
    { icon: 'sparkles',           label: 'Generar rutina',   key: 'generate-routine' },
  ],
  nutrition: [
    { icon: 'restaurant-outline', label: 'Registrar comida', key: 'log-meal' },
    { icon: 'water-outline',      label: 'Registrar agua',   key: 'log-water' },
  ],
  health: [
    { icon: 'pulse-outline',    label: 'Nueva métrica',    key: 'new-metric' },
    { icon: 'calendar-outline', label: 'Agendar consulta', key: 'schedule-appointment' },
  ],
};

/** Spring sin overshoot para apertura del menú */
const OPEN_SPRING  = { damping: 22, stiffness: 280, overshootClamping: true } as const;
/** Spring suave para feedback del botón */
const PRESS_SPRING = { damping: 18, stiffness: 300, overshootClamping: true } as const;

// ─── Sub-componentes ─────────────────────────────────────────────────────────

/** Ítem individual del tab bar (icono + label) */
function TabItem({
  route,
  isFocused,
  label,
  isDark,
  onPress,
}: {
  route: { name: string };
  isFocused: boolean;
  label: string;
  isDark: boolean;
  onPress: () => void;
}) {
  const icons = TAB_ICONS[route.name] ?? { outline: 'ellipse-outline', filled: 'ellipse' };
  const iconColor = isFocused
    ? (isDark ? '#ffffff' : '#18181b')
    : (isDark ? '#71717a' : '#a1a1aa');

  return (
    <Pressable
      onPress={onPress}
      className="items-center justify-center w-[72px] h-14"
    >
      <Ionicons
        name={(isFocused ? icons.filled : icons.outline) as any}
        size={24}
        color={iconColor}
      />
      <Text
        className={`text-[10px] mt-1 font-semibold ${
          isFocused
            ? (isDark ? 'text-white' : 'text-zinc-900')
            : (isDark ? 'text-zinc-500' : 'text-zinc-400')
        }`}
      >
        {label}
      </Text>
    </Pressable>
  );
}

/** Ítem individual dentro del menú desplegable del FAB */
function FabMenuItem({
  option,
  isDark,
  isPressed,
  iconColor,
  onPress,
  onPressIn,
  onPressOut,
}: {
  option: MenuOption;
  isDark: boolean;
  isPressed: boolean;
  iconColor: string;
  onPress: () => void;
  onPressIn: () => void;
  onPressOut: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      className="flex-row items-center px-5 py-4"
      style={{
        // Solo el backgroundColor es dinámico runtime — el resto va en className
        backgroundColor: isPressed
          ? (isDark ? 'rgba(255,255,255,0.09)' : 'rgba(0,0,0,0.055)')
          : 'transparent',
      }}
    >
      {/* Fondo del icono */}
      <View className={`w-9 h-9 rounded-xl items-center justify-center mr-3 ${
        isDark ? 'bg-zinc-700' : 'bg-gray-100'
      }`}>
        <Ionicons
          name={option.icon as any}
          size={19}
          color={iconColor}
        />
      </View>

      <Text className={`text-[15px] font-semibold ${
        isDark ? 'text-white' : 'text-zinc-900'
      }`}>
        {option.label}
      </Text>
    </Pressable>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────

interface MyTabBarProps extends BottomTabBarProps {
  onFabAction?: (actionKey: string) => void;
}

export function MyTabBar({ state, descriptors, navigation, onFabAction }: MyTabBarProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const insets = useSafeAreaInsets();

  const [isMenuOpen, setIsMenuOpen]   = useState(false);
  const [pressedKey, setPressedKey]   = useState<string | null>(null);

  /** Contexto de la vista de detalle de rutina para opciones contextuales */
  const { isDetailVisible, isSwapMode, actions: routineActions, onGenerateRoutine } = useRoutineDetailContext();

  /** Progreso de animación del menú: 0 = cerrado, 1 = abierto */
  const menuProgress = useSharedValue(0);
  /** Escala del botón FAB para feedback de press */
  const fabScale     = useSharedValue(1);

  const activeRouteName = state.routes[state.index]?.name ?? 'index';

  /** Opciones del menú: contextuales según estado de la vista de rutina */
  const menuOptions: MenuOption[] = (() => {
    if (isDetailVisible && activeRouteName === 'index') {
      // Modo edición de ejercicios activo
      if (isSwapMode) {
        return [
          { icon: 'flash-outline',  label: 'Sugerencia',         key: 'request-suggestions' },
          { icon: 'sparkles',       label: 'Sugerencia con IA',  key: 'request-suggestions-ai' },
          { icon: 'close-circle-outline', label: 'Salir del modo editar', key: 'exit-swap-mode' },
        ];
      }
      // Vista de detalle abierta sin modo edición
      return [
        { icon: 'refresh',          label: 'Regenerar rutina',    key: 'regenerate-routine' },
        { icon: 'swap-horizontal',  label: 'Cambiar ejercicios',  key: 'change-exercises' },
      ];
    }
    return FAB_MENU_OPTIONS[activeRouteName] ?? FAB_MENU_OPTIONS.index;
  })();

  // ── Handlers ──────────────────────────────────────────────────────────────

  const openMenu = useCallback(() => {
    setIsMenuOpen(true);
    menuProgress.value = withSpring(1, OPEN_SPRING);
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  }, [menuProgress]);

  const closeMenu = useCallback(() => {
    menuProgress.value = withTiming(0, { duration: 180, easing: Easing.in(Easing.cubic) });
    setTimeout(() => setIsMenuOpen(false), 185);
  }, [menuProgress]);

  const toggleMenu = useCallback(() => {
    if (isMenuOpen) closeMenu();
    else openMenu();
  }, [isMenuOpen, openMenu, closeMenu]);

  const handleMenuAction = useCallback((key: string) => {
    console.log('[MyTabBar] handleMenuAction →', key);
    closeMenu();
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    // ⚠️ React Native no permite 2 Modals simultáneos. El menú del FAB usa
    // <Modal>, así que tenemos que esperar a que termine de cerrarse antes
    // de disparar acciones que abran su propio Modal (confirmación, candidatos…).
    const run = () => {
      // Acciones contextuales de la vista de rutina
      if (key === 'regenerate-routine' && routineActions?.onRegenerate) {
        routineActions.onRegenerate();
        return;
      }
      if (key === 'change-exercises' && routineActions?.onChangeExercises) {
        routineActions.onChangeExercises();
        return;
      }
      if (key === 'request-suggestions' && routineActions?.onRequestSuggestions) {
        routineActions.onRequestSuggestions(false);
        return;
      }
      if (key === 'request-suggestions-ai' && routineActions?.onRequestSuggestions) {
        routineActions.onRequestSuggestions(true);
        return;
      }
      if (key === 'exit-swap-mode' && routineActions?.onExitSwapMode) {
        routineActions.onExitSwapMode();
        return;
      }
      if (key === 'generate-routine' && onGenerateRoutine) {
        onGenerateRoutine();
        return;
      }
      onFabAction?.(key);
    };

    // 220ms > 185ms del closeMenu para asegurar que el Modal del menú ya
    // se desmontó antes de pedir abrir otro Modal.
    setTimeout(run, 220);
  }, [closeMenu, onFabAction, routineActions, onGenerateRoutine]);

  const onFabPressIn  = useCallback(() => { fabScale.value = withSpring(0.92, PRESS_SPRING); }, [fabScale]);
  const onFabPressOut = useCallback(() => { fabScale.value = withSpring(1,    PRESS_SPRING); }, [fabScale]);

  // ── Filtrado de rutas visibles ─────────────────────────────────────────────

  const VISIBLE_LEFT  = ['index', 'fitness'];
  const VISIBLE_RIGHT = ['nutrition', 'health'];

  const leftRoutes: TabRoute[] = state.routes
    .map((route, idx) => ({ route, originalIndex: idx }))
    .filter(({ route }) => VISIBLE_LEFT.includes(route.name));

  const rightRoutes: TabRoute[] = state.routes
    .map((route, idx) => ({ route, originalIndex: idx }))
    .filter(({ route }) => VISIBLE_RIGHT.includes(route.name));

  // ── Animated styles ────────────────────────────────────────────────────────

  /** Rotación del "+" y escala del botón unificadas en un solo animated style */
  const fabAnimStyle = useAnimatedStyle(() => ({
    transform: [
      { scale:  fabScale.value },
      { rotate: `${interpolate(menuProgress.value, [0, 1], [0, 45])}deg` },
    ],
  }));

  /** Crossfade out para los 3 puntos: counter-rotación para que quede horizontal mientras desvanece */
  const ellipsisAnimStyle = useAnimatedStyle(() => ({
    opacity: interpolate(menuProgress.value, [0, 0.5], [1, 0]),
    transform: [{ rotate: `${interpolate(menuProgress.value, [0, 1], [0, -45])}deg` }],
  }));

  /** Crossfade in para el icono que se convierte en X (un "add" normal) */
  const crossIconAnimStyle = useAnimatedStyle(() => ({
    opacity: interpolate(menuProgress.value, [0.5, 1], [0, 1]),
    position: 'absolute',
  }));

  /** Morphing del menú: escala desde abajo + opacidad */
  const menuAnimStyle = useAnimatedStyle(() => ({
    opacity: interpolate(menuProgress.value, [0, 0.35, 1], [0, 0.85, 1]),
    transform: [
      { scale:      interpolate(menuProgress.value, [0, 1], [0.55, 1]) },
      { translateY: interpolate(menuProgress.value, [0, 1], [40, 0]) },
    ],
  }));

  /** Overlay que bloquea interacciones mientras el menú está abierto */
  const overlayAnimStyle = useAnimatedStyle(() => ({
    opacity: interpolate(menuProgress.value, [0, 1], [0, 1]),
  }));

  /** El tab bar se oculta cuando la vista de detalle de rutina está abierta */
  if (isDetailVisible) return null;

  // ── Colores dinámicos del FAB y de los iconos del menú según la vista activa ──
  const getThemeColors = () => {
    if (isDetailVisible || activeRouteName === 'fitness') {
      // lime-400
      return {
        fabBg: '#a3e635',
        fabIconColor: '#18181b',
        menuIconColor: '#a3e635',
        // En modo edición: lápiz; en detalle normal: ellipsis; en fitness: add
        fabIconName: isSwapMode
          ? 'create-outline'
          : isDetailVisible
            ? 'ellipsis-horizontal'
            : 'add',
      };
    }
    if (activeRouteName === 'nutrition') {
      // amber-400
      return {
        fabBg: '#fbbf24',
        fabIconColor: '#18181b',
        menuIconColor: '#fbbf24',
        fabIconName: 'add',
      };
    }
    if (activeRouteName === 'health') {
      // rose-600 light / rose-400 dark
      return {
        fabBg: isDark ? '#fb7185' : '#e11d48',
        fabIconColor: '#ffffff',
        menuIconColor: isDark ? '#fb7185' : '#e11d48',
        fabIconName: 'add',
      };
    }
    // index / home — zinc-50 dark / zinc-950 light (Acento Global Marca)
    return {
      fabBg: isDark ? '#fafafa' : '#09090b',
      fabIconColor: isDark ? '#09090b' : '#fafafa',
      menuIconColor: isDark ? '#09090b' : '#fafafa',
      fabIconName: 'add',
    };
  };

  const { fabBg, fabIconColor, menuIconColor, fabIconName } = getThemeColors();

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <>
      <Modal visible={isMenuOpen} transparent animationType="none" onRequestClose={closeMenu}>
        {/* Overlay transparente para cerrar el menú al tocar fuera */}
        <Animated.View
          className="flex-1"
          style={overlayAnimStyle}
        >
          <Pressable className="flex-1" onPress={closeMenu} />
        </Animated.View>

        {/* Menú desplegable con efecto de morphing */}
        <Animated.View
          className="absolute self-center z-50"
          style={[
            {
              bottom: Math.max(insets.bottom, 8) + 8 + 56 + 16,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.18,
              shadowRadius: 24,
              elevation: 12,
            },
            menuAnimStyle,
          ]}
        >
          {/* Card del menú */}
          <View className={`rounded-2xl overflow-hidden min-w-[230px] ${
            isDark ? 'bg-zinc-800' : 'bg-white'
          }`}>
            {menuOptions.map((option) => (
              <FabMenuItem
                key={option.key}
                option={option}
                isDark={isDark}
                isPressed={pressedKey === option.key}
                iconColor={menuIconColor}
                onPress={() => handleMenuAction(option.key)}
                onPressIn={() => setPressedKey(option.key)}
                onPressOut={() => setPressedKey(null)}
              />
            ))}
          </View>

          {/* Triángulo indicador apuntando al botón */}
          <View className="items-center">
            <View style={{
              width: 0, height: 0,
              borderLeftWidth: 11, borderRightWidth: 11, borderTopWidth: 9,
              borderLeftColor: 'transparent', borderRightColor: 'transparent',
              borderTopColor: isDark ? '#3f3f46' : '#ffffff',
            }} />
          </View>
        </Animated.View>
      </Modal>

      {/* Tab Bar principal */}
      <View
        className={`absolute self-center flex-row items-center rounded-full py-2 px-2 ${
          isDark
            ? 'bg-zinc-900 border border-zinc-800'
            : 'bg-white border border-zinc-200'
        }`}
        style={{
          bottom: Math.max(insets.bottom, 8) + 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: isDark ? 0.4 : 0.1,
          shadowRadius: 16,
          elevation: 8,
        }}
      >
        {leftRoutes.map(({ route, originalIndex }) => (
          <TabItem
            key={route.key}
            route={route}
            isFocused={state.index === originalIndex}
            label={(descriptors[route.key]?.options?.title ?? route.name) as string}
            isDark={isDark}
            onPress={() => {
              if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              if (isMenuOpen) closeMenu();
              const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
              if (state.index !== originalIndex && !event.defaultPrevented) {
                navigation.navigate(route.name, route.params);
              }
            }}
          />
        ))}

        {/* Botón FAB central — dentro del tab bar */}
        <Pressable
          onPress={toggleMenu}
          onPressIn={onFabPressIn}
          onPressOut={onFabPressOut}
          className="items-center justify-center mx-2 w-[72px] h-14"
        >
          <Animated.View
            className="items-center justify-center"
            style={[
              {
                width: 48,
                height: 48,
                borderRadius: 24,
                backgroundColor: fabBg,
                shadowColor: fabBg,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.35,
                shadowRadius: 8,
                elevation: 6,
              },
              fabAnimStyle,
            ]}
          >
            {fabIconName === 'add' ? (
              <Ionicons name="add" size={32} color={fabIconColor} />
            ) : (
              <>
                <Animated.View style={ellipsisAnimStyle}>
                  <Ionicons name={fabIconName as any} size={fabIconName === 'create-outline' ? 26 : 32} color={fabIconColor} />
                </Animated.View>
                <Animated.View style={crossIconAnimStyle} pointerEvents="none">
                  <Ionicons name="add" size={32} color={fabIconColor} />
                </Animated.View>
              </>
            )}
          </Animated.View>
        </Pressable>

        {rightRoutes.map(({ route, originalIndex }) => (
          <TabItem
            key={route.key}
            route={route}
            isFocused={state.index === originalIndex}
            label={(descriptors[route.key]?.options?.title ?? route.name) as string}
            isDark={isDark}
            onPress={() => {
              if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              if (isMenuOpen) closeMenu();
              const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
              if (state.index !== originalIndex && !event.defaultPrevented) {
                navigation.navigate(route.name, route.params);
              }
            }}
          />
        ))}
      </View>
    </>
  );
}
