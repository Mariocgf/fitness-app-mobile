import { ForumComment } from '@/src/types/forum';
import { formatRelativeTime } from '@/src/utils/relative-time';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

interface CommentItemProps {
  comment: ForumComment;
  onReport: (comment: ForumComment) => void;
}

/** Un comentario plano: autor (o "Usuario eliminado"), tiempo, cuerpo y acción de denunciar. */
export function CommentItem({ comment, onReport }: CommentItemProps) {
  const hasAuthor = comment.authorName.trim().length > 0;
  const authorLabel = hasAuthor ? comment.authorName : 'Usuario eliminado';
  const initial = hasAuthor ? comment.authorName.trim().charAt(0).toUpperCase() : '?';

  return (
    <View className="flex-row px-4 py-3 border-b border-zinc-800/60">
      <View className="w-9 h-9 rounded-full bg-zinc-800 items-center justify-center mr-3">
        <Text className="text-sky-400 font-bold text-sm">{initial}</Text>
      </View>
      <View className="flex-1">
        <View className="flex-row items-center">
          <Text
            className={`font-semibold text-sm flex-1 ${hasAuthor ? 'text-white' : 'text-zinc-500 italic'}`}
            numberOfLines={1}
          >
            {authorLabel}
          </Text>
          <Text className="text-zinc-600 text-xs mr-3">{formatRelativeTime(comment.createdAt)}</Text>
          <TouchableOpacity onPress={() => onReport(comment)} hitSlop={8} className="p-0.5">
            <Ionicons name="flag-outline" size={14} color="#52525b" />
          </TouchableOpacity>
        </View>
        <Text className="text-zinc-300 text-sm leading-5 mt-1">{comment.body}</Text>
      </View>
    </View>
  );
}
