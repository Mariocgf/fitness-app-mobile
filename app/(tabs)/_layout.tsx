import { Tabs } from 'expo-router';
import React from 'react';
import { useAuth } from '@clerk/clerk-expo';

import { HapticTab } from '@/src/components/common/haptic-tab';
import { IconSymbol } from '@/src/components/common/ui/icon-symbol';
import { Colors } from '@/src/utils/constants/theme';
import { useColorScheme } from '@/src/hooks/use-color-scheme';

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
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShown: false,
        tabBarButton: HapticTab,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="house.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Explore',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="paperplane.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="person.fill" color={color} />,
        }}
      />

    </Tabs>
  );
}
