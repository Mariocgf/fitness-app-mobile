import SwipeBackWrapper from '@/src/components/common/SwipeBackWrapper';
import { AttachedRoutineSnapshotView } from '@/src/components/features/forum/AttachedRoutineSnapshotView';
import { CommentComposer } from '@/src/components/features/forum/CommentComposer';
import { CommentItem } from '@/src/components/features/forum/CommentItem';
import { FlagWarningList } from '@/src/components/features/forum/FlagWarningList';
import { HashtaggedText } from '@/src/components/features/forum/HashtaggedText';
import { TAB_BAR_HEIGHT } from '@/src/components/features/routine/routine-detail-shared';
import { confirm, toast } from '@/src/components/ui/feedback';
import { useForumComments } from '@/src/hooks/useForumComments';
import { useForumPost } from '@/src/hooks/useForumPost';
import { copyRoutine, isRoutineLimitError, reportComment, reportPost } from '@/src/services/forum.service';
import { ForumComment } from '@/src/types/forum';
import { formatRelativeTime } from '@/src/utils/relative-time';
import { useKeyboardHeight } from '@/src/hooks/useKeyboardHeight';
import { useAuth } from '@clerk/clerk-expo';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const SKY = '#38bdf8';
const SUBSCRIPTION_ROUTE = '/profile/subscription';

/**
 * Detalle de un post del foro: autor, cuerpo completo, snapshot de la rutina adjunta (si tiene)
 * con las flags resaltadas, "Copiar rutina" (mapea el "Save"), comentarios (listar + crear con
 * manejo de 422) y denunciar post/comentario.
 * REGLA DE ORO #1: las flags advierten; sin flags no se muestra nada verde.
 * El detalle NO trae likes (van en el feed): acá no se muestran ni se inventan.
 */
export default function CommunityPostDetailScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id, focusComment } = useLocalSearchParams<{ id: string; focusComment?: string }>();
  const { getToken } = useAuth();
  const getTokenRef = useRef(getToken);
  getTokenRef.current = getToken;

  const { post, isLoading, error, reload } = useForumPost(id);
  const {
    comments, isLoading: isLoadingComments, isLoadingMore, isSubmitting,
    flaggedTerms, clearFlagged, hasNextPage, totalCount, loadMore, submit, removeComment,
  } = useForumComments(id);
  const [isCopying, setIsCopying] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  const { isKeyboardVisible } = useKeyboardHeight();

  // El detalle SIEMPRE viene del feed de Comunidad. En web, `router.back()` no es fiable
  // con tabs (puede saltar al Home porque cambiar de tab no deja entrada en el history),
  // así que navegamos explícito al feed. `navigate` en nativo hace pop al feed si ya está
  // en el stack, así que también funciona ahí.
  const handleBack = useCallback(() => router.navigate('/community'), [router]);

  /** Al enfocar el input (tap directo o desde el ícono del feed): baja hasta él. */
  const handleComposerFocus = useCallback(() => {
    // Pequeño delay para esperar el inset del teclado antes de scrollear al final.
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 250);
  }, []);

  const handleCopyRoutine = useCallback(async () => {
    if (!id || isCopying) return;
    setIsCopying(true);
    try {
      const token = await getTokenRef.current();
      await copyRoutine(id, token);
      toast.success('La rutina quedó guardada en tus rutinas (inactiva).', {
        title: 'Rutina copiada',
        action: { label: 'Ver mis rutinas', onPress: () => router.push('/fitness/routines') },
      });
    } catch (err) {
      if (isRoutineLimitError(err)) {
        // 403 del plan: mensaje accionable del back + CTA de upgrade (no el error genérico).
        toast.error(err.message, {
          title: 'Límite de tu plan',
          duration: 10000,
          action: { label: 'Mejorar plan', onPress: () => router.push(SUBSCRIPTION_ROUTE) },
        });
      } else {
        toast.error(err instanceof Error ? err.message : 'No pudimos copiar la rutina.');
      }
    } finally {
      setIsCopying(false);
    }
  }, [id, isCopying, router]);

  const handleReportPost = useCallback(async () => {
    if (!id) return;
    const ok = await confirm({
      title: 'Denunciar publicación',
      message: '¿Querés denunciar esta publicación? Nuestro equipo la va a revisar.',
      confirmText: 'Denunciar',
      cancelText: 'Cancelar',
      destructive: true,
    });
    if (!ok) return;
    try {
      const token = await getTokenRef.current();
      const result = await reportPost(id, undefined, token);
      if (result.hidden) {
        toast.success('La publicación fue ocultada.');
        router.back();
      } else {
        toast.success('Gracias. Vamos a revisarla.');
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'No pudimos procesar la denuncia.');
    }
  }, [id, router]);

  const handleReportComment = useCallback(async (comment: ForumComment) => {
    const ok = await confirm({
      title: 'Denunciar comentario',
      message: '¿Querés denunciar este comentario? Nuestro equipo lo va a revisar.',
      confirmText: 'Denunciar',
      cancelText: 'Cancelar',
      destructive: true,
    });
    if (!ok) return;
    try {
      const token = await getTokenRef.current();
      const result = await reportComment(comment.id, undefined, token);
      if (result.hidden) {
        removeComment(comment.id);
        toast.success('El comentario fue ocultado.');
      } else {
        toast.success('Gracias. Vamos a revisarlo.');
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'No pudimos procesar la denuncia.');
    }
  }, [removeComment]);

  const hasAuthor = !!post && post.authorName.trim().length > 0;
  const authorLabel = hasAuthor ? post!.authorName : 'Usuario eliminado';
  const initial = hasAuthor ? post!.authorName.trim().charAt(0).toUpperCase() : '?';

  const header = (
    <View style={{ paddingTop: insets.top }} className="px-4">
      <View className="flex-row items-center justify-between py-2">
        <TouchableOpacity onPress={handleBack} className="-ml-2 p-2" hitSlop={8} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={26} color="#a1a1aa" />
        </TouchableOpacity>
        {post && (
          <TouchableOpacity onPress={handleReportPost} className="-mr-2 p-2" hitSlop={8} activeOpacity={0.7}>
            <Ionicons name="flag-outline" size={20} color="#a1a1aa" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  return (
    <SwipeBackWrapper onSwipeBack={handleBack}>
      <View className="flex-1 bg-zinc-950">
        {header}

        {isLoading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color={SKY} />
          </View>
        ) : error || !post ? (
          <View className="flex-1 items-center justify-center px-8">
            <Ionicons name="alert-circle-outline" size={48} color="#52525b" />
            <Text className="text-zinc-300 text-base font-medium mt-4 text-center">
              {error ?? 'Esta publicación ya no está disponible.'}
            </Text>
            <TouchableOpacity
              onPress={reload}
              className="mt-4 px-6 py-3 rounded-2xl bg-sky-400/10 border border-sky-400"
              activeOpacity={0.85}
            >
              <Text className="text-sky-400 font-semibold">Reintentar</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <ScrollView
            ref={scrollRef}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            automaticallyAdjustKeyboardInsets={Platform.OS === 'ios'}
            contentContainerStyle={{
              paddingBottom: isKeyboardVisible ? 24 : insets.bottom + TAB_BAR_HEIGHT + 24,
            }}
          >
              {/* Autor */}
              <View className="flex-row items-center px-4 mb-3 mt-1">
                <View className="w-11 h-11 rounded-full bg-zinc-800 items-center justify-center mr-3">
                  <Text className="text-sky-400 font-bold text-lg">{initial}</Text>
                </View>
                <View className="flex-1">
                  <Text
                    className={`font-semibold text-base ${hasAuthor ? 'text-white' : 'text-zinc-500 italic'}`}
                    numberOfLines={1}
                  >
                    {authorLabel}
                  </Text>
                  <Text className="text-zinc-500 text-xs">{formatRelativeTime(post.createdAt)}</Text>
                </View>
              </View>

              {/* Título + cuerpo completo */}
              <Text className="text-white font-bold text-2xl px-4 mb-2">{post.title}</Text>
              <HashtaggedText text={post.body} className="text-zinc-300 text-base leading-6 px-4" />

              {/* Advertencias (solo si hay flags) */}
              <FlagWarningList flags={post.flags} />

              {/* Snapshot de la rutina adjunta + copiar (inline) */}
              {post.attachedRoutine && (
                <>
                  <View className="px-4 mt-6 mb-1 flex-row items-center">
                    <Ionicons name="barbell-outline" size={18} color={SKY} />
                    <Text className="text-white font-bold text-lg ml-2">Rutina adjunta</Text>
                  </View>
                  <AttachedRoutineSnapshotView routine={post.attachedRoutine} flags={post.flags} />

                  <View className="px-4 mt-4">
                    <TouchableOpacity
                      onPress={handleCopyRoutine}
                      disabled={isCopying}
                      activeOpacity={0.85}
                      className="flex-row items-center justify-center bg-sky-400 rounded-2xl py-4"
                      style={{ opacity: isCopying ? 0.7 : 1 }}
                    >
                      {isCopying ? (
                        <ActivityIndicator size="small" color="#09090b" />
                      ) : (
                        <Ionicons name="bookmark-outline" size={20} color="#09090b" />
                      )}
                      <Text className="text-zinc-900 font-bold text-base ml-2">
                        {isCopying ? 'Copiando...' : 'Copiar rutina'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}

              {/* Comentarios */}
              <View className="px-4 mt-8 mb-2 flex-row items-center">
                <Ionicons name="chatbubble-outline" size={16} color="#71717a" />
                <Text className="text-zinc-400 text-sm ml-2 font-semibold">
                  {totalCount || post.commentCount}{' '}
                  {(totalCount || post.commentCount) === 1 ? 'comentario' : 'comentarios'}
                </Text>
              </View>

              {/* Lista */}
              {isLoadingComments ? (
                <View className="py-6 items-center">
                  <ActivityIndicator size="small" color={SKY} />
                </View>
              ) : comments.length === 0 ? (
                <Text className="text-zinc-500 text-sm text-center px-4 py-6">
                  Todavía no hay comentarios. Sé el primero.
                </Text>
              ) : (
                <View className="mt-1">
                  {comments.map((comment) => (
                    <CommentItem key={comment.id} comment={comment} onReport={handleReportComment} />
                  ))}
                  {hasNextPage && (
                    <TouchableOpacity
                      onPress={loadMore}
                      disabled={isLoadingMore}
                      activeOpacity={0.7}
                      className="flex-row items-center justify-center py-4"
                    >
                      {isLoadingMore ? (
                        <ActivityIndicator size="small" color={SKY} />
                      ) : (
                        <Text className="text-sky-400 text-sm font-semibold">Ver más comentarios</Text>
                      )}
                    </TouchableOpacity>
                  )}
                </View>
              )}

              {/* Composer inline al final: al enfocarlo (tap directo o desde el ícono del
                  feed) sube encima del teclado y la pantalla scrollea hasta él. */}
              <View className="mt-4 pt-3 border-t border-zinc-800">
                <CommentComposer
                  isSubmitting={isSubmitting}
                  flaggedTerms={flaggedTerms}
                  onSubmit={submit}
                  onChange={clearFlagged}
                  autoFocus={focusComment === '1'}
                  onFocus={handleComposerFocus}
                />
              </View>
          </ScrollView>
        )}
      </View>
    </SwipeBackWrapper>
  );
}
