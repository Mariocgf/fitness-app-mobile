import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    DeviceEventEmitter,
    Dimensions,
    Keyboard,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

/** Alto máximo del dropdown (coincide con el maxHeight del estilo). */
const DROPDOWN_MAX_HEIGHT = 200;

/**
 * Forma mínima de un ítem seleccionable. `severity` es OPCIONAL: las lesiones
 * y afecciones de Salud la traen (dot de color por gravedad), pero otros módulos
 * como las alergias de Nutrición no, y el dot cae a un gris neutro.
 * Mantiene al átomo desacoplado del dominio de Salud (es reutilizable).
 */
export interface SelectableItem {
  id: string;
  name: string;
  severity?: 'Low' | 'Medium' | 'High';
}

/**
 * Colores semánticos por severidad del ítem (lesión/afección).
 * Se conservan como punto de color aunque la maqueta no los muestre:
 * son el dato que distingue gravedad, no el acento del módulo.
 */
const SEVERITY_COLORS: Record<string, string> = {
  Low: '#2dd4bf',    // teal-400
  Medium: '#fb923c', // orange-400
  High: '#f87171',   // red-400
};

/** Color del dot: por severidad si existe, gris neutro si no (ej. alergias). */
const dotColor = (severity?: string): string =>
  (severity && SEVERITY_COLORS[severity]) || '#a1a1aa';

interface SearchableSelectProps {
  items: SelectableItem[];
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
  placeholder?: string;
  /** Título del encabezado de la card (opcional) */
  cardTitle?: string;
  /** Subtítulo del encabezado de la card (opcional) */
  cardSubtitle?: string;
  /** Nombre del ícono Ionicons para la card (opcional) */
  cardIconName?: string;
}

/**
 * Card reutilizable de búsqueda + selección de ítems (dark-only zinc).
 * Rediseñada desde la maqueta de "Datos de salud": una sola card con título,
 * buscador con lupa y, debajo, los ítems seleccionados con un botón circular
 * para quitarlos. Conserva el punto de color de severidad por ítem.
 *
 * Se usa en el onboarding de Salud (Lesiones / Afecciones), su configuración de
 * Perfil y el onboarding de Nutrición (Alergias). El acento de módulo lo aporta el
 * consumidor (footer, spinner): este átomo es neutro para reutilizarse en cualquier
 * módulo, y acepta ítems sin `severity` (el dot cae a gris neutro).
 */
export default function SearchableSelect({
  items,
  selectedIds,
  onSelectionChange,
  placeholder = 'Buscar',
  cardTitle,
  cardSubtitle,
  cardIconName,
}: SearchableSelectProps) {
  const inputRef = useRef<TextInput>(null);

  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const componentId = useRef(Math.random().toString()).current;
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  /** true = la lista se abre hacia ARRIBA (cuando el teclado taparía la de abajo). */
  const [openUp, setOpenUp] = useState(false);
  const searchBoxRef = useRef<View>(null);

  const safeItems = Array.isArray(items) ? items : [];
  const safeSelectedIds = Array.isArray(selectedIds) ? selectedIds : [];

  const filteredItems = useMemo(() => {
    const available = safeItems.filter((item) => !safeSelectedIds.includes(item.id));
    if (!query.trim()) return available;
    const q = query.toLowerCase().trim();
    return available.filter((item) => item.name.toLowerCase().includes(q));
  }, [safeItems, safeSelectedIds, query]);

  const selectedItems = useMemo(
    () => safeItems.filter((item) => safeSelectedIds.includes(item.id)),
    [safeItems, safeSelectedIds]
  );

  useEffect(() => {
    const s1 = Keyboard.addListener('keyboardDidShow', (e) => {
      setKeyboardVisible(true);
      setKeyboardHeight(e.endCoordinates?.height ?? 0);
    });
    const s2 = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardVisible(false);
      setKeyboardHeight(0);
    });
    return () => { s1.remove(); s2.remove(); };
  }, []);

  /**
   * Decide si la lista se abre hacia arriba o hacia abajo: mide la posición del
   * input y, si abajo no entra el dropdown por encima del teclado, la abre hacia
   * arriba. Así el teclado nunca tapa las opciones. (El dropdown es absoluto, por
   * lo que no altera la altura medida del recuadro del input.)
   */
  const decideOpenDirection = useCallback(() => {
    searchBoxRef.current?.measureInWindow((_x, y, _w, h) => {
      const screenH = Dimensions.get('window').height;
      // Estimación del teclado mientras aún está subiendo (keyboardDidShow llega tarde).
      const kb = keyboardHeight || screenH * 0.38;
      const spaceBelow = screenH - kb - (y + h);
      setOpenUp(spaceBelow < DROPDOWN_MAX_HEIGHT + 12);
    });
  }, [keyboardHeight]);

  // Recalcula la dirección cuando cambia la altura real del teclado con la lista abierta.
  useEffect(() => {
    if (isOpen) decideOpenDirection();
  }, [keyboardHeight, isOpen, decideOpenDirection]);

  useEffect(() => {
    const sub1 = DeviceEventEmitter.addListener('closeDropdowns', () => {
      if (isKeyboardVisible) {
        Keyboard.dismiss();
        return;
      }
      setIsOpen(false);
      inputRef.current?.blur();
    });
    const sub2 = DeviceEventEmitter.addListener('closeOtherDropdowns', (id) => {
      if (id !== componentId) setIsOpen(false);
    });
    return () => { sub1.remove(); sub2.remove(); };
  }, [isKeyboardVisible, isOpen]);

  const handleSelect = (item: SelectableItem) => {
    onSelectionChange([...safeSelectedIds, item.id]);
    setQuery('');
    setIsOpen(false);
    Keyboard.dismiss();
  };

  const handleRemove = (id: string) => {
    onSelectionChange(safeSelectedIds.filter((sid) => sid !== id));
  };

  const handleFocus = () => {
    DeviceEventEmitter.emit('closeOtherDropdowns', componentId);
    setIsOpen(true);
    decideOpenDirection();
  };

  const handleChangeText = (text: string) => {
    setQuery(text);
    if (!isOpen) setIsOpen(true);
  };

  return (
    // Al abrir la lista elevamos el zIndex de toda la card para que el dropdown
    // (absoluto) quede por ENCIMA de las cards siguientes. Sin esto, en PWA la lista
    // se pierde detrás de la card de abajo y en nativo el input de la otra card queda
    // encima de la lista. RNW pone position:relative + zIndex:0 por defecto en cada
    // View, así que subirlo acá reordena entre hermanos en ambas plataformas.
    <View
      className="bg-zinc-900 rounded-3xl p-5 border border-zinc-800"
      style={{ zIndex: isOpen ? 20 : 0 }}
    >
      {/* Encabezado opcional (sin ícono = look maqueta onboarding) */}
      {cardTitle && (
        <View className="flex-row items-center gap-3 mb-4">
          {cardIconName && (
            <View className="w-10 h-10 rounded-full bg-zinc-800 items-center justify-center">
              <Ionicons name={cardIconName as any} size={20} className="text-zinc-400" />
            </View>
          )}
          <View className="flex-1">
            <Text className="text-xl font-bold text-white">{cardTitle}</Text>
            {cardSubtitle && (
              <Text className="text-sm text-zinc-400 mt-0.5">{cardSubtitle}</Text>
            )}
          </View>
        </View>
      )}

      {/* Buscador con lupa */}
      <View ref={searchBoxRef} style={{ zIndex: 50 }}>
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => inputRef.current?.focus()}
          className={`flex-row items-center gap-3 border rounded-2xl px-4 bg-zinc-950 ${
            isOpen ? 'border-zinc-600' : 'border-zinc-800'
          }`}
          style={{ height: 54 }}
        >
          <Ionicons name="search" size={20} className="text-zinc-500" />
          <TextInput
            ref={inputRef}
            value={query}
            onChangeText={handleChangeText}
            onFocus={handleFocus}
            placeholder={placeholder}
            placeholderTextColor="#71717a"
            style={{
              flex: 1,
              height: 54,
              paddingVertical: 0,
              fontSize: 16,
              color: '#ffffff',
            }}
            autoCorrect={false}
            autoCapitalize="none"
            returnKeyType="done"
            blurOnSubmit={true}
            onSubmitEditing={() => Keyboard.dismiss()}
          />
        </TouchableOpacity>

        {/* Dropdown de resultados */}
        {isOpen && filteredItems.length > 0 && (
          <View
            className="absolute left-0 right-0 rounded-2xl overflow-hidden border border-zinc-700 bg-zinc-800"
            style={{
              // Hacia abajo (top) o hacia arriba (bottom) según el espacio disponible.
              ...(openUp ? { bottom: 58 } : { top: 58 }),
              maxHeight: DROPDOWN_MAX_HEIGHT,
              zIndex: 100,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 8,
            }}
          >
            <ScrollView
              keyboardShouldPersistTaps="always"
              nestedScrollEnabled
              showsVerticalScrollIndicator={false}
            >
              {filteredItems.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  onPress={() => handleSelect(item)}
                  activeOpacity={0.6}
                  className="flex-row items-center px-4 py-3 border-b border-zinc-700/50"
                >
                  <View
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: 5,
                      backgroundColor: dotColor(item.severity),
                      marginRight: 12,
                    }}
                  />
                  <Text className="flex-1 text-[15px] text-zinc-200">{item.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}
      </View>

      {/* Ítems seleccionados: fila por ítem con botón circular para quitar */}
      {selectedItems.length > 0 && (
        <View className="mt-2">
          {selectedItems.map((item) => (
            <View
              key={item.id}
              className="flex-row items-center py-4 border-t border-zinc-800"
            >
              <View
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: 5,
                  backgroundColor: dotColor(item.severity),
                  marginRight: 12,
                }}
              />
              <Text className="flex-1 text-base text-white">{item.name}</Text>
              <TouchableOpacity
                onPress={() => handleRemove(item.id)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                className="w-7 h-7 rounded-full border border-zinc-600 items-center justify-center"
              >
                <Ionicons name="close" size={16} className="text-zinc-400" />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}
