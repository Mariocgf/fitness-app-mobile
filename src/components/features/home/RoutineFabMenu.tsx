import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

/** Botón flotante (FAB) con menú desplegable para acciones de rutina */

interface RoutineFabMenuProps {
  isMenuVisible: boolean;
  onToggleMenu: () => void;
  onGenerateRoutine: () => void;
}

export const RoutineFabMenu: React.FC<RoutineFabMenuProps> = ({
  isMenuVisible,
  onToggleMenu,
  onGenerateRoutine,
}) => {
  return (
    <>
      {/* Menú desplegable */}
      {isMenuVisible && (
        <View className="absolute bottom-24 right-6 bg-zinc-800 rounded-2xl p-2 shadow-lg border border-zinc-700">
          <TouchableOpacity
            className="flex-row items-center p-3"
            onPress={() => {
              onToggleMenu();
              onGenerateRoutine();
            }}
          >
            <Ionicons name="sparkles" size={20} color="white" />
            <Text className="text-white ml-2 font-medium">Generar rutina</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Botón FAB */}
      <TouchableOpacity
        style={{
          elevation: 5,
          shadowColor: '#000',
          shadowOpacity: 0.3,
          shadowRadius: 4,
          shadowOffset: { width: 0, height: 2 },
        }}
        className="absolute bottom-6 right-6 w-14 h-14 bg-lime-300 rounded-full items-center justify-center"
        onPress={onToggleMenu}
      >
        <Ionicons name={isMenuVisible ? 'close' : 'add'} size={32} color="black" />
      </TouchableOpacity>
    </>
  );
};
