import SwipeBackWrapper from '@/src/components/common/SwipeBackWrapper';
import { MyForumPostCard } from '@/src/components/features/forum/MyForumPostCard';
import { TAB_BAR_HEIGHT } from '@/src/components/features/routine/routine-detail-shared';
import { useMyForumPosts } from '@/src/hooks/useMyForumPosts';
import { MyForumPostSummary } from '@/src/types/forum';
import { useUser } from '@clerk/clerk-expo';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useRef } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const SKY = '#38bdf8';

/**
 * "Mis publicaciones" (`GET /api/forum/me/posts`). Lista paginada de TUS posts, más nuevos
 * primero, incluidas las publicaciones ocultadas por moderación (marcadas con su aviso).
 *
 * El autor sos vos, así que el avatar sale del `imageUrl` de Clerk — el mismo que usan el
 * header del Home y el perfil.
 */
export default function MyCommunityPostsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useUser();
  const { posts, isLoading, isRefreshing, isLoadingMore, error, totalCount, refresh, loadMore } =
    useMyForumPosts();

  const authorName = user?.fullName?.trim() || user?.firstName?.trim() || 'Vos';
  const avatarUrl = user?.imageUrl;

  // Refresca al RE-enfocar (ej. al volver del detalle tras comentar), nunca en el montaje:
  // esa carga ya la hace el hook y duplicaría el fetch.
  const isFirstFocus = useRef(true);
  useFocusEffect(
    useCallback(() => {
      if (isFirstFocus.current) {
        isFirstFocus.current = false;
        return;
      }
      refresh();
    }, [refresh]),
  );

  const handleBack = useCallback(() => router.navigate('/community'), [router]);

  const handleOpenPost = useCallback(
    (post: MyForumPostSummary) => {
      router.push(`/community/${post.id}` as any);
    },
    [router],
  );

  const handleCreatePost = useCallback(() => {
    router.push('/community/new' as any);
  }, [router]);

  const renderItem = useCallback(
    ({ item }: { item: MyForumPostSummary }) => (
      <MyForumPostCard
        post={item}
        onPress={handleOpenPost}
        avatarUrl={avatarUrl}
        authorName={authorName}
      />
    ),
    [handleOpenPost, avatarUrl, authorName],
  );

  return (
    <SwipeBackWrapper onSwipeBack={handleBack}>
      <View className="flex-1 bg-zinc-950">
        {/* Header: volver + título + total real del backend */}
        <View style={{ paddingTop: insets.top }} className="px-4">
          <View className="flex-row items-center py-2">
            <TouchableOpacity onPress={handleBack} className="-ml-2 p-2" hitSlop={8} activeOpacity={0.7}>
              <Ionicons name="chevron-back" size={26} color="#a1a1aa" />
            </TouchableOpacity>
            <View className="flex-1 ml-1">
              <Text className="text-2xl font-bold text-white">Mis publicaciones</Text>
              {!isLoading && !error && totalCount > 0 && (
                <Text className="text-zinc-500 text-xs mt-0.5">
                  {totalCount === 1 ? '1 publicación' : `${totalCount} publicaciones`}
                </Text>
              )}
            </View>
          </View>
        </View>

        {isLoading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color={SKY} />
          </View>
        ) : error ? (
          <ScrollView
            contentContainerClassName="flex-1 items-center justify-center px-8"
            refreshControl={
              <RefreshControl refreshing={isRefreshing} onRefresh={refresh} tintColor={SKY} />
            }
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
                <Ionicons name="document-text-outline" size={44} color="#52525b" />
                <Text className="text-zinc-400 text-base mt-4 text-center">
                  Todavía no publicaste nada en la comunidad.
                </Text>
                <TouchableOpacity
                  onPress={handleCreatePost}
                  activeOpacity={0.85}
                  className="mt-5 flex-row items-center px-5 py-2.5 rounded-full bg-sky-400"
                >
                  <Ionicons name="create-outline" size={18} color="#09090b" />
                  <Text className="text-zinc-900 font-bold text-sm ml-1.5">Publicar</Text>
                </TouchableOpacity>
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
      </View>
    </SwipeBackWrapper>
  );
}
