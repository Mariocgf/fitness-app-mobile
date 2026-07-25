import { ForumFlag } from '@/src/types/forum';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Text, View } from 'react-native';

const AMBER = '#fbbf24';

/**
 * Arma el texto de una flag. Es ESTRUCTURA, no frase: el back manda `kind` + `subject`.
 *  - Injury    → advertencia por lesión del lector.
 *  - Equipment → advertencia por equipo que le falta.
 */
function flagMessage(flag: ForumFlag): string {
  if (flag.kind === 'Injury') {
    return `Esta rutina puede afectar tu lesión: ${flag.subject}.`;
  }
  return `Requiere equipo que no tenés registrado: ${flag.subject}.`;
}

interface FlagWarningListProps {
  flags: ForumFlag[];
}

/**
 * Lista de advertencias sobre la rutina adjunta.
 *
 * REGLA DE ORO #1: el sistema ADVIERTE, NO BENDICE. Con flags mostramos advertencias
 * (tono ámbar/warning). Sin flags NO se renderiza NADA — ni un contenedor, ni un verde
 * de "compatible con vos". `flags: []` = silencio, no aprobación.
 */
export function FlagWarningList({ flags }: FlagWarningListProps) {
  if (flags.length === 0) return null;

  return (
    <View className="mx-4 mt-4 rounded-2xl border border-amber-400/30 bg-amber-400/10 p-4">
      <View className="flex-row items-center mb-2">
        <Ionicons name="warning-outline" size={18} color={AMBER} />
        <Text className="text-amber-400 font-bold text-sm ml-2">
          Antes de copiar, tené en cuenta
        </Text>
      </View>
      {flags.map((flag, index) => (
        <View key={`${flag.kind}-${flag.subject}-${index}`} className="flex-row items-start mt-1.5">
          <Text className="text-amber-400 mr-2 leading-5">•</Text>
          <Text className="text-amber-200/90 text-sm leading-5 flex-1">{flagMessage(flag)}</Text>
        </View>
      ))}
    </View>
  );
}
