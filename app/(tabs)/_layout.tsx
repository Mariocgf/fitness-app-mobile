import { useColorScheme } from '@/src/hooks/use-color-scheme';
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

  if (!isLoaded || !isSignedIn) return null;

  const activeTint = isDark ? '#f8fafc' : '#09090b';
  const inactiveTint = isDark ? '#64748b' : '#94a3b8';

  return (
    <RoutineDetailProvider>
      <NutritionRoutineProvider>
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
                borderTopWidth: 0,
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
                        backgroundColor: isDark
                          ? 'rgba(2, 6, 23, 0.88)'
                          : 'rgba(248, 250, 252, 0.88)',
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

            <Tabs.Screen
              name="explore"
              options={{ href: null }}
            />
        </Tabs>
      </NutritionRoutineProvider>
    </RoutineDetailProvider>
  );
}
