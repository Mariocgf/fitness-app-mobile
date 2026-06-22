import React from 'react';
import { View } from 'react-native';

interface DarkSheetLayoutProps {
  /** Contenido en la zona header superior (header, pills, etc.) */
  header: React.ReactNode;
  /** Contenido en la hoja redondeada inferior */
  children: React.ReactNode;
}

/**
 * Layout de pantalla con zona header (slate-950) y hoja inferior redondeada
 * (slate-800). App dark-only.
 *
 * Uso:
 *   <DarkSheetLayout header={<MiHeader />}>
 *     <MiContenido />
 *   </DarkSheetLayout>
 */
export const DarkSheetLayout: React.FC<DarkSheetLayoutProps> = ({ header, children }) => (
  <View className="flex-1 bg-slate-950">

    {/* Zona header */}
    <View>
      {header}
    </View>

    {/* Hoja con radio top */}
    <View className="flex-1 overflow-hidden bg-slate-800 border border-slate-700 rounded-t-3xl">
      {children}
    </View>
  </View>
);
