import { useCommentPreview } from '@/src/hooks/useCommentPreview';
import { ForumPostSummary } from '@/src/types/forum';
import { formatRelativeTime } from '@/src/utils/relative-time';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { HashtaggedText } from './HashtaggedText';

const SKY = '#38bdf8';
const ZINC_500 = '#71717a';

interface ForumPostCardProps {
  post: ForumPostSummary;
  /** Abre el detalle del post (Fase 2). Lo dispara la card entera y "Ver rutina". */
  onPress: (post: ForumPostSummary) => void;
  /** Toggle de like (UI optimista). Si se omite, el corazón queda de solo lectura. */
  onToggleLike?: (post: ForumPostSummary) => void;
  /** Tocar el ícono de comentar: abre el detalle con el input enfocado para escribir. */
  onComment?: (post: ForumPostSummary) => void;
}

/**
 * Card del feed del foro. Estilo inspirado en la maqueta (dark, redondeada, header de
 * autor, footer social) pero mapeada SOLO a campos reales del backend:
 * NO se renderiza imagen, métricas de workout, vistas ni score (no existen en el contrato).
 * El "Save" de la maqueta se mapea a "Copiar rutina" y vive en el detalle (Fase 2).
 *
 * `authorName` vacío → "Usuario eliminado" (el autor borró su cuenta).
 * El `body` viene COMPLETO del back: se trunca acá (regla de oro #2).
 * Like/comentarios son solo lectura en esta fase; la interacción llega en la Fase 4.
 */
export function ForumPostCard({ post, onPress, onToggleLike, onComment }: ForumPostCardProps) {
  const hasAuthor = post.authorName.trim().length > 0;
  const authorLabel = hasAuthor ? post.authorName : 'Usuario eliminado';
  const initial = hasAuthor ? post.authorName.trim().charAt(0).toUpperCase() : '?';
  const hasRoutine = post.attachedRoutineVersionId != null;

  // Preview de los últimos comentarios (best-effort; solo si el post tiene comentarios).
  const commentPreview = useCommentPreview(post.id, post.commentCount);

  return (
    <TouchableOpacity
      onPress={() => onPress(post)}
      activeOpacity={0.85}
      className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 mb-3"
    >
      {/* Header: avatar-placeholder + autor + tiempo relativo */}
      <View className="flex-row items-center mb-3">
        <View className="w-10 h-10 rounded-full bg-zinc-800 items-center justify-center mr-3">
          <Text className="text-sky-400 font-bold text-base">{initial}</Text>
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

      {/* Título + cuerpo truncado (con hashtags resaltados) */}
      <Text className="text-white font-bold text-base mb-1" numberOfLines={2}>
        {post.title}
      </Text>
      <HashtaggedText
        text={post.body}
        className="text-zinc-300 text-sm leading-5"
        numberOfLines={3}
      />

      {/* "Ver rutina" solo si el post tiene rutina adjunta */}
      {hasRoutine && (
        <TouchableOpacity
          onPress={() => onPress(post)}
          activeOpacity={0.7}
          className="flex-row items-center self-start mt-3 px-3 py-1.5 rounded-full bg-sky-400/10"
        >
          <Ionicons name="barbell-outline" size={15} color={SKY} />
          <Text className="text-sky-400 text-sm font-semibold ml-1.5">Ver rutina</Text>
        </TouchableOpacity>
      )}

      {/* Footer social: like (interactivo, optimista) + comentarios (abren el detalle) */}
      <View className="flex-row items-center mt-4 pt-3 border-t border-zinc-800">
        <TouchableOpacity
          onPress={onToggleLike ? () => onToggleLike(post) : undefined}
          disabled={!onToggleLike}
          hitSlop={8}
          activeOpacity={0.7}
          className="flex-row items-center mr-6"
        >
          <Ionicons
            name={post.likedByMe ? 'heart' : 'heart-outline'}
            size={18}
            color={post.likedByMe ? '#f87171' : ZINC_500}
          />
          <Text className="text-zinc-400 text-sm ml-1.5">{post.likeCount}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => (onComment ?? onPress)(post)}
          hitSlop={8}
          activeOpacity={0.7}
          className="flex-row items-center"
        >
          <Ionicons name="chatbubble-outline" size={17} color={ZINC_500} />
          <Text className="text-zinc-400 text-sm ml-1.5">{post.commentCount}</Text>
        </TouchableOpacity>
      </View>

      {/* Preview de los últimos comentarios */}
      {commentPreview.length > 0 && (
        <View className="mt-3 pt-3 border-t border-zinc-800/60">
          {commentPreview.map((comment) => {
            const name = comment.authorName.trim().length > 0 ? comment.authorName : 'Usuario eliminado';
            return (
              <Text key={comment.id} numberOfLines={1} className="text-zinc-400 text-xs mb-1">
                <Text className="text-zinc-300 font-semibold">{name}: </Text>
                {comment.body}
              </Text>
            );
          })}
          {post.commentCount > commentPreview.length && (
            <Text className="text-sky-400 text-xs font-semibold mt-0.5">
              Ver los {post.commentCount} comentarios
            </Text>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
}
