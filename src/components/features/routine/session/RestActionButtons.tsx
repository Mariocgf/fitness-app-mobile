import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { TouchableOpacity, View } from 'react-native';

interface RestActionButtonsProps {
  onFinishSessionEarly: () => void;
  onFinishRest: () => void;
}

export const RestActionButtons: React.FC<RestActionButtonsProps> = ({
  onFinishSessionEarly,
  onFinishRest,
}) => {
  return (
    <View className="flex-1 flex-row gap-3 items-end">
      <TouchableOpacity
        className="flex-1 h-[88px] rounded-3xl bg-red-500 items-center justify-center"
        onPress={onFinishSessionEarly}
      >
        <Ionicons name="flag" size={42} color="white" />
      </TouchableOpacity>
      <TouchableOpacity
        className="flex-1 h-[88px] rounded-3xl bg-lime-400 items-center justify-center"
        onPress={onFinishRest}
      >
        <Ionicons name="arrow-forward" size={54} color="black" />
      </TouchableOpacity>
    </View>
  );
};
