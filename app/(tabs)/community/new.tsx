import SwipeBackWrapper from '@/src/components/common/SwipeBackWrapper';
import { AttachRoutinePicker } from '@/src/components/features/forum/AttachRoutinePicker';
import { HighlightedTextInput } from '@/src/components/features/forum/HighlightedTextInput';
import { TAB_BAR_HEIGHT } from '@/src/components/features/routine/routine-detail-shared';
import { toast } from '@/src/components/ui/feedback';
import { useCreatePost } from '@/src/hooks/useCreatePost';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const ZINC_600 = '#52525b';

/**
 * Crear un post. Título + cuerpo (requeridos) + adjuntar rutina propia (opcional).
 * Manejo del 422: si el back marca términos, se resaltan en un preview para corregir.
 * Cross-platform: `KeyboardAvoidingView` con `padding` solo en iOS; web/Android no lo precisan.
 */
export default function CreatePostScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const {
    title, setTitle,
    body, setBody,
    attachedRoutine, setAttachedRoutine,
    isSubmitting, error, flaggedTerms, canSubmit, submit,
  } = useCreatePost();

  // En web, `router.back()` con tabs puede saltar al Home; navegamos explícito al feed.
  const handleBack = useCallback(() => router.navigate('/community'), [router]);

  const handleSubmit = useCallback(async () => {
    const result = await submit();
    if (result) {
      // Volvemos al feed (que se refresca al reenfocarse) en vez de navegar al detalle del
      // post recién creado: un GET-by-id inmediato puede 404 (consistencia eventual) y hacía
      // ver "esta publicación ya no está disponible" aunque el post SÍ se creó. En el feed
      // aparece arriba (más nuevos primero).
      toast.success('¡Publicación creada!');
      router.navigate('/community');
    }
  }, [submit, router]);

  const hasFlagged = flaggedTerms.length > 0;

  return (
    <SwipeBackWrapper onSwipeBack={handleBack}>
      <View className="flex-1 bg-zinc-950">
        {/* Header: back + título + Publicar */}
        <View style={{ paddingTop: insets.top }} className="px-4">
          <View className="flex-row items-center justify-between py-2">
            <TouchableOpacity onPress={handleBack} className="-ml-2 p-2" hitSlop={8} activeOpacity={0.7}>
              <Ionicons name="chevron-back" size={26} color="#a1a1aa" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleSubmit}
              disabled={!canSubmit}
              activeOpacity={0.85}
              className={`flex-row items-center px-4 py-2 rounded-full ${
                canSubmit ? 'bg-sky-400' : 'bg-zinc-800'
              }`}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="#09090b" />
              ) : (
                <Text className={`font-bold text-sm ${canSubmit ? 'text-zinc-900' : 'text-zinc-500'}`}>
                  Publicar
                </Text>
              )}
            </TouchableOpacity>
          </View>
          <Text className="text-white text-3xl font-bold pb-2">Nueva publicación</Text>
        </View>

        <KeyboardAvoidingView
          className="flex-1"
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={insets.top + 48}
        >
          <ScrollView
            className="flex-1"
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{
              paddingHorizontal: 16,
              paddingTop: 8,
              paddingBottom: insets.bottom + TAB_BAR_HEIGHT + 24,
            }}
          >
            {/* Título */}
            <Text className="text-white font-bold text-base px-1 mb-2">Título</Text>
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder="¿De qué querés hablar?"
              placeholderTextColor={ZINC_600}
              maxLength={120}
              className="rounded-2xl border border-zinc-800 bg-zinc-900 text-white text-base px-4 py-3.5"
            />

            {/* Cuerpo — resalta los términos marcados DENTRO del cuadro */}
            <Text className="text-white font-bold text-base px-1 mb-2 mt-5">Contenido</Text>
            <HighlightedTextInput
              value={body}
              onChangeText={setBody}
              terms={flaggedTerms}
              placeholder="Compartí tu experiencia, tips, progreso..."
              placeholderTextColor={ZINC_600}
              multiline
              minHeight={140}
              containerClassName={`rounded-2xl border bg-zinc-900 ${
                hasFlagged ? 'border-red-500/60' : 'border-zinc-800'
              }`}
            />

            {/* Banner de términos marcados (422): mensaje + chips (el resaltado va en el cuadro) */}
            {hasFlagged && (
              <View className="mt-3 rounded-2xl border border-red-500/40 bg-red-500/10 p-4">
                <View className="flex-row items-center mb-2">
                  <Ionicons name="alert-circle" size={18} color="#f87171" />
                  <Text className="text-red-300 font-bold text-sm ml-2 flex-1">
                    {error ?? 'Hay términos que no están permitidos. Editalos para publicar.'}
                  </Text>
                </View>
                <View className="flex-row flex-wrap">
                  {flaggedTerms.map((term, index) => (
                    <View key={`${term}-${index}`} className="bg-red-500/25 rounded-full px-3 py-1 mr-2 mb-1">
                      <Text className="text-red-200 text-xs font-semibold">{term}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Error genérico (no-422) */}
            {error && !hasFlagged && (
              <Text className="text-rose-400 text-sm mt-3 px-1">{error}</Text>
            )}

            {/* Adjuntar rutina propia (opcional) */}
            <AttachRoutinePicker selected={attachedRoutine} onSelect={setAttachedRoutine} />
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </SwipeBackWrapper>
  );
}
