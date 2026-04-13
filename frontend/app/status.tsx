import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  CollapsibleSection,
  Divider,
  MyStatusCard,
  StatusHeader,
  StatusItem,
  StatusSection,
} from '../src/components/status';
import { useStatusData } from '../src/hooks/useStatusData';
import { useTheme } from '../src/hooks/useTheme';
import { StatusEntry } from '../src/types/status';

export default function StatusScreen() {
  const router = useRouter();
  const { colors, metrics } = useTheme();
  const {
    myStatus,
    recentUpdates,
    viewedUpdates,
    mutedUpdates,
    isViewedCollapsed,
    isMutedCollapsed,
    toggleViewed,
    toggleMuted,
  } = useStatusData();

  const styles = React.useMemo(
    () =>
      StyleSheet.create({
        safeArea: {
          flex: 1,
          backgroundColor: colors.background,
        },
        list: {
          flex: 1,
          backgroundColor: colors.background,
        },
        listContent: {
          paddingBottom: metrics['3xl'],
        },
        rowGroup: {
        //   paddingHorizontal: metrics.md,
        },
      }),
    [colors, metrics],
  );

  const openStoryViewer = React.useCallback(
    (item: StatusEntry) => {
      router.push({
        pathname: '/status-viewer',
        params: {
          name: item.name,
          avatar: item.avatar,
          time: item.time,
        },
      });
    },
    [router],
  );

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.safeArea}>
      <StatusHeader onClose={() => router.back()} />

      <ScrollView contentContainerStyle={styles.listContent} style={styles.list}>
        <StatusSection title="My Status">
          <MyStatusCard
            item={myStatus}
            onLongPress={() => openStoryViewer(myStatus)}
            onPress={() => openStoryViewer(myStatus)}
            onPressAdd={() => openStoryViewer(myStatus)}
          />
        </StatusSection>

        <Divider />

        <StatusSection title="Recent updates">
          <View style={styles.rowGroup}>
            {recentUpdates.map((item) => (
              <StatusItem
                avatar={item.avatar}
                key={item.id}
                name={item.name}
                onLongPress={() => openStoryViewer(item)}
                onPress={() => openStoryViewer(item)}
                ringType={item.ringType}
                time={item.time}
              />
            ))}
          </View>
        </StatusSection>

        <Divider />

        <CollapsibleSection isCollapsed={isViewedCollapsed} onToggle={toggleViewed} title="Viewed updates">
          <View style={styles.rowGroup}>
            {viewedUpdates.map((item) => (
              <StatusItem
                avatar={item.avatar}
                key={item.id}
                name={item.name}
                onLongPress={() => openStoryViewer(item)}
                onPress={() => openStoryViewer(item)}
                ringType={item.ringType}
                time={item.time}
              />
            ))}
          </View>
        </CollapsibleSection>

        <Divider />

        <CollapsibleSection isCollapsed={isMutedCollapsed} onToggle={toggleMuted} title="Muted updates">
          <View style={styles.rowGroup}>
            {mutedUpdates.map((item) => (
              <StatusItem
                avatar={item.avatar}
                key={item.id}
                name={item.name}
                onLongPress={() => openStoryViewer(item)}
                onPress={() => openStoryViewer(item)}
                ringType={item.ringType}
                time={item.time}
              />
            ))}
          </View>
        </CollapsibleSection>
      </ScrollView>
    </SafeAreaView>
  );
}
