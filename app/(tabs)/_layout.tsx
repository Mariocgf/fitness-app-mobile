import { Tabs } from 'expo-router';
import React from 'react';
import { useAuth } from '@clerk/clerk-expo';

import { HapticTab } from '@/src/components/common/haptic-tab';
import { IconSymbol } from '@/src/components/common/ui/icon-symbol';
import { Colors } from '@/src/utils/constants/theme';
import { useColorScheme } from '@/src/hooks/use-color-scheme';

import { MyTabBar } from '@/src/components/common/MyTabBar';

export default function TabLayout() {
  const colorScheme = useColorScheme();
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
        name="explore"
        options={{
          title: 'Explore',
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
        }}
      />
    </Tabs>
  );
}
