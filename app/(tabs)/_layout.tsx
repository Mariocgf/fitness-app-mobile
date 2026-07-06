import { useColorScheme } from '@/src/hooks/use-color-scheme';
import { useIsOffline } from '@/src/hooks/useIsOffline';
import { OfflineSyncGate } from '@/src/offline/OfflineSyncGate';
import { NutritionRoutineProvider } from '@/src/store/nutrition-routine-context';
import { RoutineDetailProvider } from '@/src/store/routine-detail-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@clerk/clerk-expo';
import { BlurView } from 'expo-blur';
import { Tabs } from 'expo-router';
import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';

export default function TabLayout() {
  const { isLoaded, isSignedIn } = useAuth();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const isOffline = useIsOffline();

  // Offline, Clerk web nunca carga (isLoaded se queda en false). Solo llegamos acá si el
  // root layout ya validó la sesión local (offlineAuthed), así que sin red dibujamos los
  // tabs igual. En nativo `isOffline` es false y el gate original se mantiene idéntico.
  if (!isOffline && (!isLoaded || !isSignedIn)) return null;

  const activeTint = isDark ? '#f8fafc' : '#09090b';
  const inactiveTint = isDark ? '#64748b' : '#94a3b8';
  // En web no hay BlurView (es iOS-only), así que el fondo semitransparente dejaba ver el
  // contenido detrás arriba y negro puro en la zona del home indicator → "barra negra" en
  // dos tonos. En web lo hacemos opaco + borde superior para que sea una barra sólida y
  // uniforme. Nativo no se toca (sigue con blur).
  const isWeb = Platform.OS === 'web';

  return (
    <RoutineDetailProvider>
      <NutritionRoutineProvider>
        <OfflineSyncGate />
        <Tabs
            screenOptions={{
              headerShown: false,
              tabBarActiveTintColor: activeTint,
              tabBarInactiveTintColor: inactiveTint,
              // Fondo transparente + posición absoluta: el contenido pasa por
              // detrás y el blur tiene algo que difuminar. Sin borde ni color
              // sólido para que no aparezca la "barra" opaca encima.
              tabBarStyle: {
                position: 'absolute',
                // Web: borde superior finito para delimitar la barra opaca. Nativo: sin
                // borde, el blur ya la separa visualmente.
                borderTopWidth: isWeb ? StyleSheet.hairlineWidth : 0,
                borderTopColor: 'rgba(255, 255, 255, 0.06)',
                backgroundColor: 'transparent',
                elevation: 0,
              },
              // Blur nativo solo en iOS. En Android, dimezisBlurView es experimental
              // y puede crashear al dibujar bitmaps hardware con rendering software.
              tabBarBackground: () => (
                Platform.OS === 'ios' ? (
                  <BlurView
                    intensity={isDark ? 40 : 60}
                    tint={isDark ? 'dark' : 'light'}
                    style={StyleSheet.absoluteFill}
                  />
                ) : (
                  <View
                    style={[
                      StyleSheet.absoluteFill,
                      {
                        // Web: opaco (sin blur disponible) → barra sólida uniforme, sin la
                        // franja negra en dos tonos. Android: mantiene el semitransparente.
                        backgroundColor: isWeb
                          ? (isDark ? '#0e0e11' : '#f8fafc')
                          : (isDark
                              ? 'rgba(2, 6, 23, 0.88)'
                              : 'rgba(248, 250, 252, 0.88)'),
                      },
                    ]}
                  />
                )
              ),
              tabBarLabelStyle: {
                fontSize: 10,
                fontWeight: '600',
              },
            }}
          >
            <Tabs.Screen
              name="index"
              options={{
                title: 'Home',
                tabBarIcon: ({ focused, color }) => (
                  <Ionicons
                    name={focused ? 'home' : 'home-outline'}
                    size={24}
                    color={color}
                  />
                ),
              }}
            />

            <Tabs.Screen
              name="fitness"
              options={{
                title: 'Rutina',
                tabBarIcon: ({ focused, color }) => (
                  <Ionicons
                    name={focused ? 'barbell' : 'barbell-outline'}
                    size={24}
                    color={color}
                  />
                ),
              }}
            />

            <Tabs.Screen
              name="nutrition"
              options={{
                title: 'Nutrición',
                tabBarIcon: ({ focused, color }) => (
                  <Ionicons
                    name={focused ? 'restaurant' : 'restaurant-outline'}
                    size={24}
                    color={color}
                  />
                ),
              }}
            />

            <Tabs.Screen
              name="health"
              options={{
                title: 'Salud',
                tabBarIcon: ({ focused, color }) => (
                  <Ionicons
                    name={focused ? 'heart' : 'heart-outline'}
                    size={24}
                    color={color}
                  />
                ),
              }}
            />
        </Tabs>
      </NutritionRoutineProvider>
    </RoutineDetailProvider>
  );
}
