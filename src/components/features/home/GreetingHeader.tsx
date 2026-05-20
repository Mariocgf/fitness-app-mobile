import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { cssInterop } from 'nativewind';
import React from 'react';
import { Image, Pressable, View } from 'react-native';

import { ThemedText } from '@/src/components/common/themed-text';
import { getGreetingByTime } from '@/src/utils/time';

cssInterop(Ionicons, {
  className: { target: 'style', nativeStyleToProp: { color: true } },
});

interface GreetingHeaderProps {
  userName: string;
  avatarUrl?: string | null;
}

export const GreetingHeader: React.FC<GreetingHeaderProps> = ({ userName, avatarUrl }) => {
  const greeting = getGreetingByTime();
  const router = useRouter();

  return (
    <View className="mb-6 px-4 flex-row items-center justify-between">
      {/* Saludo */}
      <View className="flex-1 mr-4">
        <ThemedText type="default" className="text-gray-500 mb-1">
          Hola, {userName}
        </ThemedText>
        <ThemedText type="title" className="text-4xl font-bold">
          {greeting}
        </ThemedText>
      </View>

      {/* Avatar → Perfil */}
      <Pressable
        onPress={() => router.push('/profile')}
        className="w-11 h-11 rounded-full overflow-hidden items-center justify-center bg-zinc-100 dark:bg-zinc-800"
      >
        {avatarUrl ? (
          <Image
            source={{ uri: avatarUrl }}
            className="w-11 h-11 rounded-full"
          />
        ) : (
          <Ionicons
            name="person"
            size={22}
            className="text-zinc-500 dark:text-zinc-400"
          />
        )}
      </Pressable>
    </View>
  );
};
