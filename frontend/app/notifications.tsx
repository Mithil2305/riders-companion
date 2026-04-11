import React from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { EmptyState, SkeletonBlock } from '../src/components/common';
import { NotificationItem } from '../src/components/notifications';
import { useNotificationsData } from '../src/hooks/useNotificationsData';
import { AppNotification } from '../src/types/notifications';
import { useTheme } from '../src/hooks/useTheme';

export default function NotificationsScreen() {
  const { colors, metrics, typography } = useTheme();
  const router = useRouter();
  const { loading, notifications, markAsRead, dismiss } = useNotificationsData();

  const styles = React.useMemo(
    () =>
      StyleSheet.create({
        safeArea: {
          flex: 1,
          backgroundColor: colors.background,
        },
        container: {
          flex: 1,
          paddingHorizontal: metrics.md,
          paddingTop: metrics.md,
        },
        header: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: metrics.md,
        },
        titleWrap: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: metrics.sm,
        },
        title: {
          color: colors.textPrimary,
          fontSize: typography.sizes['2xl'],
          fontWeight: '700',
        },
        listContent: {
          paddingBottom: metrics['3xl'],
          gap: metrics.sm,
        },
        skeletonRow: {
          borderRadius: metrics.radius.xl,
          height: 92,
          marginBottom: metrics.sm,
        },
      }),
    [colors, metrics, typography],
  );

  const renderNotification = React.useCallback(
    ({ item, index }: { item: AppNotification; index: number }) => (
      <NotificationItem index={index} item={item} onDismiss={dismiss} onPress={markAsRead} />
    ),
    [dismiss, markAsRead],
  );

  if (loading) {
    return (
      <SafeAreaView edges={['top', 'left', 'right']} style={styles.safeArea}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Pressable onPress={() => router.back()}>
              <Ionicons color={colors.primary} name="arrow-back" size={metrics.icon.md} />
            </Pressable>
            <View style={styles.titleWrap}>
              <Ionicons color={colors.primary} name="notifications-outline" size={metrics.icon.md} />
              <Text style={styles.title}>Notifications</Text>
            </View>
            <View style={{ width: metrics.icon.md }} />
          </View>
          <SkeletonBlock style={styles.skeletonRow} />
          <SkeletonBlock style={styles.skeletonRow} />
          <SkeletonBlock style={styles.skeletonRow} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()}>
            <Ionicons color={colors.primary} name="arrow-back" size={metrics.icon.md} />
          </Pressable>
          <View style={styles.titleWrap}>
            <Ionicons color={colors.primary} name="notifications-outline" size={metrics.icon.md} />
            <Text style={styles.title}>Notifications</Text>
          </View>
          <View style={{ width: metrics.icon.md }} />
        </View>

        <FlatList
          ListEmptyComponent={
            <EmptyState
              icon="notifications-off-outline"
              subtitle="You are all caught up. New ride updates will appear here."
              title="No notifications"
            />
          }
          contentContainerStyle={styles.listContent}
          data={notifications}
          keyExtractor={(item) => item.id}
          renderItem={renderNotification}
          showsVerticalScrollIndicator={false}
        />
      </View>
    </SafeAreaView>
  );
}
