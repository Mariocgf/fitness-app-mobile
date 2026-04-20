import { IconSymbol } from '@/src/components/common/ui/icon-symbol';
import { useColorScheme } from '@/src/hooks/use-color-scheme';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import * as Haptics from 'expo-haptics';
import { useState } from 'react';
import { LayoutChangeEvent, Platform, Pressable } from 'react-native';
import Animated, { LinearTransition, useAnimatedStyle, withSpring } from 'react-native-reanimated';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function MyTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  // Guardamos las dimensiones (x y width) de cada uno de los botones para animar
  const [dimensions, setDimensions] = useState<{ x: number; width: number }[]>([]);

  const onTabbarLayout = (e: LayoutChangeEvent, index: number) => {
    const { x, width } = e.nativeEvent.layout;
    setDimensions((prev) => {
      const newDim = [...prev];
      newDim[index] = { x, width };
      return newDim;
    });
  };

  // Estilo animado para el indicador deslizable (pill) de fondo - Amortiguación alta para evitar rebotes
  const animatedIndicatorStyle = useAnimatedStyle(() => {
    const activeDimension = dimensions[state.index];
    if (!activeDimension) return { opacity: 0 };
    return {
      opacity: 1,
      // Damping alto (50) elimina el rebote físico por completo
      width: withSpring(activeDimension.width, { damping: 10, stiffness: 200, overshootClamping: true }),
      transform: [{ translateX: withSpring(activeDimension.x, { damping: 10, stiffness: 200, overshootClamping: true }) }],
    };
  }, [state.index, dimensions]);

  return (
    <Animated.View
      layout={LinearTransition}
      className={`absolute bottom-6 flex-row items-center self-center h-20 p-2 rounded-full border ${isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-gray-200'
        } shadow-xl shadow-black/20`}
    >
      {/* --- EL INDICADOR ANIMADO DE FONDO --- */}
      {dimensions.length > 0 && (
        <Animated.View
          style={[
            {
              position: 'absolute',
              height: '100%',
              top: 8,
              bottom: 8,
              left: 0,
              borderRadius: 100,
              backgroundColor: isDark ? 'white' : '#0f172a',
            },
            animatedIndicatorStyle,
          ]}
        />
      )}

      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const label =
          options.tabBarLabel !== undefined
            ? options.tabBarLabel
            : options.title !== undefined
              ? options.title
              : route.name;

        const getIconName = (routeName: string) => {
          switch (routeName) {
            case 'index': return 'house.fill';
            case 'explore': return 'paperplane.fill';
            case 'profile': return 'person.fill';
            default: return 'circle';
          }
        };

        const isFocused = state.index === index;

        const onPress = () => {
          if (Platform.OS === 'ios') {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name, route.params);
          }
        };

        return (
          <AnimatedPressable
            layout={LinearTransition}
            onLayout={(e) => onTabbarLayout(e, index)}
            key={route.key}
            onPress={onPress}
            className="flex-row items-center justify-center p-3 rounded-full mx-[2px] bg-transparent"
          >
            <IconSymbol
              size={24}
              name={getIconName(route.name) as any}
              color={isFocused ? (isDark ? '#000' : '#fff') : (isDark ? '#a1a1aa' : '#64748b')}
            />
            {isFocused && (
              <Animated.Text
                layout={LinearTransition}
                className={`ml-2 font-semibold ${isDark ? 'text-black' : 'text-white'}`}
              >
                {label as string}
              </Animated.Text>
            )}
          </AnimatedPressable>
        );
      })}
    </Animated.View>
  );
}
