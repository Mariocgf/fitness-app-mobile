import React from 'react';
import { View } from 'react-native';

interface DarkSheetLayoutProps {
  /** Contenido en la zona header superior (header, pills, etc.) */
  header: React.ReactNode;
  /** Contenido en la hoja redondeada inferior */
  children: React.ReactNode;
}

/**
 * Layout de pantalla con zona header (slate-100 / slate-950 en dark) y hoja inferior
 * redondeada (slate-100 / slate-800 en dark). 
 *
 * Uso:
 *   <DarkSheetLayout header={<MiHeader />}>
 *     <MiContenido />
 *   </DarkSheetLayout>
 */
export const DarkSheetLayout: React.FC<DarkSheetLayoutProps> = ({ header, children }) => (
  <View className="flex-1 bg-slate-100 dark:bg-slate-950">

    {/* Zona header */}
    <View className="">
      {header}
    </View>

    {/* Hoja con radio top */}
    <View
      className="flex-1 overflow-hidden bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-t-3xl"
    >
      {children}
    </View>
  </View>
);
