import { MyForumPostSummary } from '@/src/types/forum';
import { formatRelativeTime } from '@/src/utils/relative-time';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { ForumAvatar } from './ForumAvatar';
import { HashtaggedText } from './HashtaggedText';

const SKY = '#38bdf8';
const ZINC_500 = '#71717a';
const AMBER = '#fbbf24';

interface MyForumPostCardProps {
  post: MyForumPostSummary;
  /** Abre el detalle del post. */
  onPress: (post: MyForumPostSummary) => void;
  /** Tu foto de perfil (Clerk `imageUrl`): acá el autor SIEMPRE sos vos. */
  avatarUrl?: string | null;
  /** Tu nombre (Clerk). Se usa para el header de la card y la inicial de fallback. */
  authorName: string;
}

/**
 * Card de una publicación PROPIA. Difiere de la del feed en dos puntos del contrato:
 *  - No hay `likedByMe`: el corazón es un CONTADOR, no una acción (no te podés likear).
 *  - Existe `isHidden`: si el post fue ocultado por moderación se avisa explícitamente.
 *    Sin ese aviso el usuario creería que se borró, y no es lo mismo (es reversible).
 * El post oculto se atenúa pero NO se esconde: sigue siendo tuyo y podés abrirlo.
 */
export function MyForumPostCard({ post, onPress, avatarUrl, authorName }: MyForumPostCardProps) {
  const hasRoutine = post.attachedRoutineVersionId != null;

  return (
    <TouchableOpacity
      onPress={() => onPress(post)}
      activeOpacity={0.85}
      className={`bg-zinc-900 rounded-2xl p-4 mb-3 border ${
        post.isHidden ? 'border-amber-500/40' : 'border-zinc-800'
      }`}
    >
      {/* Header: tu foto + tu nombre + tiempo relativo */}
      <View className="flex-row items-center mb-3">
        <View className="mr-3">
          <ForumAvatar uri={avatarUrl} name={authorName} size={40} />
        </View>
        <View className="flex-1">
          <Text className="text-white font-semibold text-base" numberOfLines={1}>
            {authorName}
          </Text>
          <Text className="text-zinc-500 text-xs">{formatRelativeTime(post.createdAt)}</Text>
        </View>
      </View>

      {/* Aviso de moderación: ocultada ≠ borrada (es reversible desde el panel) */}
      {post.isHidden && (
        <View className="flex-row items-center self-start mb-2 px-2.5 py-1 rounded-full bg-amber-500/10">
          <Ionicons name="eye-off-outline" size={13} color={AMBER} />
          <Text className="text-amber-400 text-xs font-semibold ml-1.5">
            Oculta por denuncias
          </Text>
        </View>
      )}

      <Text
        className={`font-bold text-base mb-1 ${post.isHidden ? 'text-zinc-400' : 'text-white'}`}
        numberOfLines={2}
      >
        {post.title}
      </Text>
      <HashtaggedText
        text={post.body}
        className={`text-sm leading-5 ${post.isHidden ? 'text-zinc-500' : 'text-zinc-300'}`}
        numberOfLines={3}
      />

      {hasRoutine && (
        <View className="flex-row items-center self-start mt-3 px-3 py-1.5 rounded-full bg-sky-400/10">
          <Ionicons name="barbell-outline" size={15} color={SKY} />
          <Text className="text-sky-400 text-sm font-semibold ml-1.5">Con rutina adjunta</Text>
        </View>
      )}

      {/* Métricas: acá son CONTADORES, no acciones (el endpoint no manda `likedByMe`) */}
      <View className="flex-row items-center mt-4 pt-3 border-t border-zinc-800">
        <View className="flex-row items-center mr-6">
          <Ionicons name="heart-outline" size={18} color={ZINC_500} />
          <Text className="text-zinc-400 text-sm ml-1.5">{post.likeCount}</Text>
        </View>
        <View className="flex-row items-center">
          <Ionicons name="chatbubble-outline" size={17} color={ZINC_500} />
          <Text className="text-zinc-400 text-sm ml-1.5">{post.commentCount}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}
