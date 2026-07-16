import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Image, Pressable, Text, View } from 'react-native';

import { CreditsBadge } from '@/src/components/features/subscription/CreditsBadge';
import { getGreetingByTime } from '@/src/utils/time';

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
        <Text className="text-zinc-400 text-base mb-1">
          {greeting}, {userName}
        </Text>
        <Text className="text-white text-4xl font-bold leading-tight">
          ¿Qué hacemos hoy?
        </Text>
      </View>

      {/* Créditos + avatar, alineados a la misma altura */}
      <View className="flex-row items-center gap-2">
        <CreditsBadge />

        {/* Avatar → Perfil */}
        <Pressable
          onPress={() => router.push('/profile')}
          className="w-11 h-11 rounded-full overflow-hidden items-center justify-center bg-zinc-800"
        >
          {avatarUrl ? (
            <Image source={{ uri: avatarUrl }} className="w-11 h-11 rounded-full" />
          ) : (
            <Ionicons name="person" size={22} className="text-zinc-400" />
          )}
        </Pressable>
      </View>
    </View>
  );
};
