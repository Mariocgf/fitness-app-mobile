import { ForumPostCard } from '@/src/components/features/forum/ForumPostCard';
import { TAB_BAR_HEIGHT } from '@/src/components/features/routine/routine-detail-shared';
import { useForumFeed } from '@/src/hooks/useForumFeed';
import { ForumPostSummary } from '@/src/types/forum';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

const SKY = '#38bdf8';

/**
 * Feed del tab Comunidad. Lista paginada de posts (más nuevos primero) con pull-to-refresh
 * y scroll infinito. Tocar una card abre el detalle (Fase 2). Publicar → `community/new` (Fase 3).
 */
export default function CommunityScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { posts, isLoading, isRefreshing, isLoadingMore, error, refresh, loadMore, toggleLike } = useForumFeed();

  const handleOpenPost = useCallback((post: ForumPostSummary) => {
    router.push(`/community/${post.id}` as any);
  }, [router]);

  const handleToggleLike = useCallback((post: ForumPostSummary) => {
    toggleLike(post.id);
  }, [toggleLike]);

  const handleComment = useCallback((post: ForumPostSummary) => {
    // Abre el detalle con el input de comentario enfocado, listo para escribir.
    router.push(`/community/${post.id}?focusComment=1` as any);
  }, [router]);

  const handleCreatePost = useCallback(() => {
    // La pantalla de crear llega en la Fase 3.
    router.push('/community/new' as any);
  }, [router]);

  const renderItem = useCallback(
    ({ item }: { item: ForumPostSummary }) => (
      <ForumPostCard
        post={item}
        onPress={handleOpenPost}
        onToggleLike={handleToggleLike}
        onComment={handleComment}
      />
    ),
    [handleOpenPost, handleToggleLike, handleComment],
  );

  return (
    <SafeAreaView className="flex-1 bg-zinc-950" edges={['top', 'left', 'right']}>
      {/* Header: título + acción publicar */}
      <View className="px-4 pt-8 pb-3 flex-row items-center justify-between">
        <Text className="text-3xl font-bold text-white">Comunidad</Text>
        <TouchableOpacity
          onPress={handleCreatePost}
          activeOpacity={0.85}
          className="flex-row items-center px-3.5 py-2 rounded-full bg-sky-400"
        >
          <Ionicons name="create-outline" size={18} color="#09090b" />
          <Text className="text-zinc-900 font-bold text-sm ml-1.5">Publicar</Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={SKY} />
        </View>
      ) : error ? (
        <ScrollView
          contentContainerClassName="flex-1 items-center justify-center px-8"
          refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={refresh} tintColor={SKY} />}
        >
          <Ionicons name="cloud-offline-outline" size={44} color="#52525b" />
          <Text className="text-zinc-400 text-base mt-4 text-center">{error}</Text>
          <TouchableOpacity
            onPress={refresh}
            activeOpacity={0.85}
            className="mt-5 px-5 py-2.5 rounded-full bg-sky-400/10 border border-sky-400"
          >
            <Text className="text-sky-400 font-semibold">Reintentar</Text>
          </TouchableOpacity>
        </ScrollView>
      ) : (
        <FlatList
          data={posts}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingTop: 8,
            paddingBottom: insets.bottom + TAB_BAR_HEIGHT + 16,
          }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={refresh} tintColor={SKY} />
          }
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          ListEmptyComponent={
            <View className="items-center justify-center px-8 pt-24">
              <Ionicons name="people-outline" size={44} color="#52525b" />
              <Text className="text-zinc-400 text-base mt-4 text-center">
                Todavía no hay publicaciones. ¡Sé el primero en compartir!
              </Text>
            </View>
          }
          ListFooterComponent={
            isLoadingMore ? (
              <View className="py-4 items-center">
                <ActivityIndicator size="small" color={SKY} />
              </View>
            ) : null
          }
        />
      )}
    </SafeAreaView>
  );
}
