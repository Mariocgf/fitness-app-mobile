import React from 'react';
import { View, ViewProps } from 'react-native';

interface InputCardProps extends ViewProps {
  children: React.ReactNode;
}

/**
 * Tarjeta contenedora para inputs de formulario.
 * Fondo white/slate-900, borde slate-200/slate-800, esquinas redondeadas.
 * Según colors.md para superficies/tarjetas.
 */
export default function InputCard({ children, className = '', ...props }: InputCardProps) {
  return (
    <View
      className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 ${className}`}
      {...props}
    >
      {children}
    </View>
  );
}
