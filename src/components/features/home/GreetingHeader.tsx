import React from 'react';
import { View, Pressable, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { getGreetingByTime } from '@/src/utils/time';
import { ThemedText } from '@/src/components/common/themed-text';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/src/hooks/use-color-scheme';

interface GreetingHeaderProps {
  userName: string;
  avatarUrl?: string | null;
}

export const GreetingHeader: React.FC<GreetingHeaderProps> = ({ userName, avatarUrl }) => {
  const greeting = getGreetingByTime();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

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
        className="items-center justify-center"
        style={{
          width: 44,
          height: 44,
          borderRadius: 22,
          overflow: 'hidden',
          backgroundColor: isDark ? '#27272a' : '#f4f4f5',
        }}
      >
        {avatarUrl ? (
          <Image
            source={{ uri: avatarUrl }}
            style={{ width: 44, height: 44, borderRadius: 22 }}
          />
        ) : (
          <Ionicons
            name="person"
            size={22}
            color={isDark ? '#a1a1aa' : '#71717a'}
          />
        )}
      </Pressable>
    </View>
  );
};
