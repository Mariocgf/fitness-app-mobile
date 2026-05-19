import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { View } from 'react-native';

interface DarkSheetLayoutProps {
  /** Contenido en la zona oscura superior (header, pills, etc.) */
  header: React.ReactNode;
  /** Contenido en la hoja redondeada inferior */
  children: React.ReactNode;
}

/**
 * Layout de pantalla con zona superior oscura (slate-900) y hoja inferior
 * redondeada (slate-100 / slate-800 en dark). Siempre fuerza status bar "light"
 * porque el header es oscuro.
 *
 * Uso:
 *   <DarkSheetLayout header={<MiHeader />}>
 *     <MiContenido />
 *   </DarkSheetLayout>
 */
export const DarkSheetLayout: React.FC<DarkSheetLayoutProps> = ({ header, children }) => (
  <View style={{ flex: 1, backgroundColor: '#0f172a' }}>
    <StatusBar style="light" />

    {/* Zona oscura */}
    <View style={{ backgroundColor: '#0f172a' }}>
      {header}
    </View>

    {/* Hoja con radio top */}
    <View
      style={{
        flex: 1,
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
        overflow: 'hidden',
      }}
      className="bg-slate-100 dark:bg-slate-800"
    >
      {children}
    </View>
  </View>
);
