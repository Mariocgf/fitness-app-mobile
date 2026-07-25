import { toast } from '@/src/components/ui/feedback';
import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native';
import { HighlightedTextInput } from './HighlightedTextInput';

const ZINC_600 = '#52525b';

interface CommentComposerProps {
  isSubmitting: boolean;
  flaggedTerms: string[];
  /** Crea el comentario; devuelve true si se publicó (para limpiar el input). */
  onSubmit: (body: string) => Promise<boolean>;
  /** Se llama al editar para limpiar el aviso de términos marcados. */
  onChange: () => void;
  /** Enfoca el input al montar (al llegar tocando el ícono de comentar desde el feed). */
  autoFocus?: boolean;
  /** Se llama cuando el input toma foco (para que la pantalla scrollee hasta él). */
  onFocus?: () => void;
}

/**
 * Input para escribir un comentario. Maneja el 422 igual que crear post: si el back marca
 * términos, los resalta DENTRO del cuadro (`HighlightedTextInput`) para que el usuario los
 * corrija antes de reenviar. Sin `Modal` ni posicionamiento absoluto → igual en nativo y PWA.
 */
export function CommentComposer({ isSubmitting, flaggedTerms, onSubmit, onChange, autoFocus, onFocus }: CommentComposerProps) {
  const [text, setText] = useState('');
  const hasFlagged = flaggedTerms.length > 0;
  const canSend = text.trim().length > 0 && !isSubmitting;

  const handleChange = useCallback((value: string) => {
    setText(value);
    onChange();
  }, [onChange]);

  const handleSend = useCallback(async () => {
    if (!canSend) return;
    const ok = await onSubmit(text);
    if (ok) {
      setText('');
      toast.success('Comentario publicado.');
    }
  }, [canSend, onSubmit, text]);

  return (
    <View className="px-4 mt-2">
      <View className="flex-row items-end">
        <HighlightedTextInput
          value={text}
          onChangeText={handleChange}
          terms={flaggedTerms}
          placeholder="Escribí un comentario..."
          placeholderTextColor={ZINC_600}
          autoFocus={autoFocus}
          onFocus={onFocus}
          multiline
          minHeight={44}
          maxLength={1000}
          fontSize={15}
          containerClassName={`flex-1 rounded-2xl border bg-zinc-900 ${
            hasFlagged ? 'border-red-500/60' : 'border-zinc-800'
          }`}
        />
        <TouchableOpacity
          onPress={handleSend}
          disabled={!canSend}
          activeOpacity={0.85}
          className={`ml-2 w-11 h-11 rounded-full items-center justify-center ${
            canSend ? 'bg-sky-400' : 'bg-zinc-800'
          }`}
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color="#09090b" />
          ) : (
            <Ionicons name="send" size={18} color={canSend ? '#09090b' : ZINC_600} />
          )}
        </TouchableOpacity>
      </View>

      {/* Banner de términos marcados (422): mensaje + chips (el resaltado va en el cuadro) */}
      {hasFlagged && (
        <View className="mt-2 rounded-2xl border border-red-500/40 bg-red-500/10 p-3">
          <View className="flex-row items-center mb-1.5">
            <Ionicons name="alert-circle" size={16} color="#f87171" />
            <Text className="text-red-300 font-semibold text-xs ml-2 flex-1">
              Hay términos que no están permitidos. Editalos para publicar.
            </Text>
          </View>
          <View className="flex-row flex-wrap">
            {flaggedTerms.map((term, index) => (
              <View key={`${term}-${index}`} className="bg-red-500/25 rounded-full px-2.5 py-0.5 mr-2 mb-0.5">
                <Text className="text-red-200 text-xs font-semibold">{term}</Text>
              </View>
            ))}
          </View>
        </View>
      )}
    </View>
  );
}
