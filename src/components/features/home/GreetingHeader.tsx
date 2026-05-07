import React from 'react';
import { View, Text } from 'react-native';
import { getGreetingByTime } from '@/src/utils/time';
import { ThemedText } from '@/src/components/common/themed-text';

interface GreetingHeaderProps {
  userName: string;
}

export const GreetingHeader: React.FC<GreetingHeaderProps> = ({ userName }) => {
  const greeting = getGreetingByTime();

  return (
    <View className="mb-6 px-4">
      <ThemedText type="default" className="text-gray-500 mb-1">
        Hola, {userName}
      </ThemedText>
      <ThemedText type="title" className="text-4xl font-bold">
        {greeting}
      </ThemedText>
    </View>
  );
};
