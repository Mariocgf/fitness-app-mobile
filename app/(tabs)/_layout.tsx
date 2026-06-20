import { useColorScheme } from '@/src/hooks/use-color-scheme';
import { NutritionRegisterProvider } from '@/src/store/nutrition-register-context';
import { NutritionRoutineProvider } from '@/src/store/nutrition-routine-context';
import { RoutineDetailProvider } from '@/src/store/routine-detail-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@clerk/clerk-expo';
import { Tabs } from 'expo-router';
import React from 'react';

export default function TabLayout() {
  const { isLoaded, isSignedIn } = useAuth();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  if (!isLoaded || !isSignedIn) return null;

  const activeTint = isDark ? '#f8fafc' : '#09090b';
  const inactiveTint = isDark ? '#64748b' : '#94a3b8';
  const tabBarBg = isDark ? '#020617' : '#ffffff';
  const tabBarBorder = isDark ? '#1e293b' : '#e2e8f0';

  return (
    <RoutineDetailProvider>
      <NutritionRoutineProvider>
        <NutritionRegisterProvider>
          <Tabs
            screenOptions={{
              headerShown: false,
              tabBarActiveTintColor: activeTint,
              tabBarInactiveTintColor: inactiveTint,
              tabBarStyle: {
                backgroundColor: tabBarBg,
                borderTopColor: tabBarBorder,
                borderTopWidth: 1,
              },
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
        </NutritionRegisterProvider>
      </NutritionRoutineProvider>
    </RoutineDetailProvider>
  );
}
