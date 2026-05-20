import { SessionSlider } from '@/src/components/common/SessionSlider';
import { useColorScheme } from '@/src/hooks/use-color-scheme';
import React from 'react';
import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native';

interface RpeSectionProps {
  rpe: number;
  onRpeChange: (value: number) => void;
  onSave: () => void;
  disabled?: boolean;
  isLoading?: boolean;
  canUpdate: boolean;
}

export const RpeSection: React.FC<RpeSectionProps> = ({
  rpe,
  onRpeChange,
  onSave,
  disabled = false,
  isLoading = false,
  canUpdate,
}) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <View>
      <Text className="text-slate-900 dark:text-slate-50 font-bold text-xl mb-2">
        Esfuerzo percibido
      </Text>
      <SessionSlider value={rpe} onValueChange={onRpeChange} min={0} max={10} disabled={disabled || isLoading} />
      <TouchableOpacity
        className={`w-full h-12 rounded-full items-center justify-center mb-6 border ${
          canUpdate
            ? 'bg-slate-900 dark:bg-slate-50 border-slate-900 dark:border-slate-50'
            : 'bg-slate-200 dark:bg-slate-800 border-slate-300 dark:border-slate-700'
        }`}
        disabled={!canUpdate}
        onPress={onSave}
      >
        {isLoading ? (
          <ActivityIndicator color={isDark ? '#020617' : '#ffffff'} size="small" />
        ) : (
          <Text
            className={`font-medium text-base ${
              canUpdate ? 'text-white dark:text-slate-900' : 'text-slate-900 dark:text-slate-50'
            }`}
          >
            Actualizar
          </Text>
        )}
      </TouchableOpacity>
    </View>
  );
};
