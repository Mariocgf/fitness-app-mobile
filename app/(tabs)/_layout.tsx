import { Tabs } from 'expo-router';
import React from 'react';
import { useAuth } from '@clerk/clerk-expo';

import { MyTabBar } from '@/src/components/common/MyTabBar';

export default function TabLayout() {
  const { isLoaded, isSignedIn } = useAuth();

  // Si Clerk no ha cargado completamente o el usuario no está autenticado,
  // no dibuja NINGÚN componente del layout de Tabs. Esto previene
  // definitivamente que se filtren vistas o parpadee el contenido protegido.
  if (!isLoaded || !isSignedIn) {
    return null;
  }

  return (
    <Tabs
      tabBar={(props) => <MyTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
        }}
      />
      <Tabs.Screen
        name="fitness"
        options={{
          title: 'Fitness',
        }}
      />
      <Tabs.Screen
        name="nutrition"
        options={{
          title: 'Nutrición',
        }}
      />
      <Tabs.Screen
        name="health"
        options={{
          title: 'Salud',
        }}
      />
      {/* Ocultar explore del tab bar — se puede remover más adelante */}
      <Tabs.Screen
        name="explore"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
