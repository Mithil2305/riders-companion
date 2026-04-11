import React from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { EmptyState } from '../../src/components/common';
import { ClipCard, RoomCard, SearchBar, UserCard } from '../../src/components/explore';
import { useExploreData } from '../../src/hooks/useExploreData';
import { useTheme } from '../../src/hooks/useTheme';
import { SuggestedUser, TrendingClip } from '../../src/types/explore';

export default function ExploreScreen() {
  const { colors, metrics, typography } = useTheme();
  const { query, users, rooms, clips, setQuery } = useExploreData();

  const renderUser = React.useCallback(
    ({ item, index }: { item: SuggestedUser; index: number }) => (
      <UserCard index={index} item={item} />
    ),
    [],
  );

  const styles = React.useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          backgroundColor: colors.background,
        },
        content: {
          paddingHorizontal: metrics.md,
          paddingTop: metrics.md,
          paddingBottom: metrics['3xl'],
          gap: metrics.lg,
        },
        titleRow: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: metrics.sm,
        },
        title: {
          fontSize: typography.sizes.xl,
          color: colors.textPrimary,
          fontWeight: '700',
        },
        sectionHeader: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: metrics.sm,
        },
        sectionTitle: {
          color: colors.textPrimary,
          fontSize: typography.sizes.lg,
          fontWeight: '700',
        },
        horizontalContent: {
          gap: metrics.md,
          paddingRight: metrics.md,
        },
        roomList: {
          gap: metrics.md,
        },
        gridWrap: {
          marginHorizontal: -metrics.xs,
        },
        clipItemWrap: {
          width: '50%',
          paddingHorizontal: metrics.xs,
          marginBottom: metrics.sm,
        },
        sectionWrap: {
          gap: metrics.sm,
        },
        emptySection: {
          borderRadius: metrics.radius.lg,
          borderWidth: 1,
          borderColor: colors.border,
          backgroundColor: colors.card,
        },
      }),
    [colors, metrics, typography],
  );

  const renderClip = React.useCallback(
    ({ item, index }: { item: TrendingClip; index: number }) => (
      <View style={styles.clipItemWrap}>
        <ClipCard index={index} item={item} />
      </View>
    ),
    [styles.clipItemWrap],
  );

  const listHeader = React.useMemo(
    () => (
      <View style={styles.content}>
        <View style={styles.titleRow}>
          <Ionicons color={colors.primary} name="search-outline" size={metrics.icon.md} />
          <Text style={styles.title}>Search</Text>
        </View>

        <SearchBar onChangeText={setQuery} value={query} />

        <View style={styles.sectionWrap}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Suggested Riders</Text>
          </View>

          {users.length === 0 ? (
            <View style={styles.emptySection}>
              <EmptyState
                icon="people-outline"
                subtitle="Try a different search term for riders."
                title="No riders found"
              />
            </View>
          ) : (
            <FlatList
              contentContainerStyle={styles.horizontalContent}
              data={users}
              horizontal
              keyExtractor={(item) => item.id}
              renderItem={renderUser}
              showsHorizontalScrollIndicator={false}
            />
          )}
        </View>

        <View style={styles.sectionWrap}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Suggested Rooms</Text>
          </View>

          {rooms.length === 0 ? (
            <View style={styles.emptySection}>
              <EmptyState
                icon="people-circle-outline"
                subtitle="No riding rooms matched this query."
                title="No rooms available"
              />
            </View>
          ) : (
            <View style={styles.roomList}>
              {rooms.map((room, index) => (
                <RoomCard index={index} item={room} key={room.id} />
              ))}
            </View>
          )}
        </View>

        <View style={styles.sectionWrap}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Trending Clips</Text>
          </View>
        </View>
      </View>
    ),
    [
      colors.primary,
      metrics.icon.md,
      query,
      renderUser,
      rooms,
      setQuery,
      styles.content,
      styles.emptySection,
      styles.horizontalContent,
      styles.roomList,
      styles.sectionHeader,
      styles.sectionTitle,
      styles.sectionWrap,
      styles.title,
      styles.titleRow,
      users,
    ],
  );

  return (
    <SafeAreaView edges={['left', 'right' , 'top']} style={styles.container}>
      <FlatList
        ListEmptyComponent={
          <View style={styles.content}>
            <EmptyState
              icon="videocam-outline"
              subtitle="No clips are trending right now."
              title="Trending is quiet"
            />
          </View>
        }
        ListHeaderComponent={listHeader}
        contentContainerStyle={styles.gridWrap}
        data={clips}
        keyExtractor={(item) => item.id}
        numColumns={2}
        renderItem={renderClip}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}
