import { Ionicons } from '@expo/vector-icons';
import { cssInterop } from 'nativewind';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

cssInterop(Ionicons, {
  className: { target: 'style', nativeStyleToProp: { color: true } },
});

interface SessionHeaderProps {
  title: string;
  onBack: () => void;
  action?: {
    icon: keyof typeof Ionicons.glyphMap;
    onPress: () => void;
  };
}

export const SessionHeader: React.FC<SessionHeaderProps> = ({ title, onBack, action }) => {
  return (
    <View className="flex-row items-center px-4 pt-3 pb-3 gap-3">
      <TouchableOpacity
        onPress={onBack}
        className="w-10 h-10 rounded-full border border-slate-200 dark:border-slate-700 items-center justify-center"
      >
        <Ionicons name="chevron-back" size={20} className="text-slate-700 dark:text-slate-100" />
      </TouchableOpacity>

      <Text
        className="flex-1 text-center text-slate-900 dark:text-slate-50 font-semibold text-base"
        numberOfLines={2}
      >
        {title}
      </Text>

      {action ? (
        <TouchableOpacity
          onPress={action.onPress}
          className="w-10 h-10 rounded-full border border-slate-200 dark:border-slate-700 items-center justify-center"
        >
          <Ionicons name={action.icon} size={20} className="text-slate-700 dark:text-slate-100" />
        </TouchableOpacity>
      ) : (
        <View className="w-10 h-10" />
      )}
    </View>
  );
};
