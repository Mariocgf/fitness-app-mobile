import React from 'react';
import { Text, View } from 'react-native';

import { getGreetingByTime } from '@/src/utils/time';

interface GreetingHeaderProps {
  userName: string;
}

export const GreetingHeader: React.FC<GreetingHeaderProps> = ({ userName }) => {
  const greeting = getGreetingByTime();

  return (
    <View className="mb-6 px-4">
      <Text className="text-slate-400 text-base mb-1">
        {greeting}, {userName}
      </Text>
      <Text className="text-white text-4xl font-bold leading-tight">
        ¿Qué hacemos hoy?
      </Text>
    </View>
  );
};
