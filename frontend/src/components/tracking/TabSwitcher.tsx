import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { TrackingTabKey } from '../../hooks/useTrackingData';
import { useTheme } from '../../hooks/useTheme';

interface TabSwitcherProps {
  activeTab: TrackingTabKey;
  followersCount: number;
  followingCount: number;
  onTabChange: (tab: TrackingTabKey) => void;
}

const TAB_KEYS: TrackingTabKey[] = ['followers', 'following'];

export function TabSwitcher({
  activeTab,
  followersCount,
  followingCount,
  onTabChange,
}: TabSwitcherProps) {
  const { colors, metrics, typography } = useTheme();
  const [containerWidth, setContainerWidth] = React.useState(0);
  const translate = useSharedValue(activeTab === 'followers' ? 0 : 1);

  React.useEffect(() => {
    translate.value = withTiming(activeTab === 'followers' ? 0 : 1, { duration: 220 });
  }, [activeTab, translate]);

  const styles = React.useMemo(
    () =>
      StyleSheet.create({
        root: {
          borderRadius: metrics.radius.full,
          borderWidth: 1,
          borderColor: colors.border,
          backgroundColor: colors.card,
          padding: 4,
          flexDirection: 'row',
          position: 'relative',
        },
        tab: {
          flex: 1,
          minHeight: 48,
          borderRadius: metrics.radius.full,
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2,
        },
        tabLabel: {
          color: colors.textSecondary,
          fontSize: typography.sizes.sm,
          fontWeight: '700',
          textTransform: 'capitalize',
        },
        activeLabel: {
          color: colors.textPrimary,
        },
        indicator: {
          position: 'absolute',
          left: 4,
          top: 4,
          bottom: 4,
          borderRadius: metrics.radius.full,
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.primary,
        },
      }),
    [colors, metrics, typography],
  );

  const tabWidth = containerWidth > 0 ? containerWidth / 2 : 0;

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translate.value * tabWidth }],
  }));

  const labelMap: Record<TrackingTabKey, string> = {
    followers: `Followers (${followersCount})`,
    following: `Following (${followingCount})`,
  };

  return (
    <View
      onLayout={(event) => setContainerWidth(event.nativeEvent.layout.width - 8)}
      style={styles.root}
    >
      <Animated.View style={[styles.indicator, { width: tabWidth }, indicatorStyle]} />
      {TAB_KEYS.map((tabKey) => (
        <Pressable key={tabKey} onPress={() => onTabChange(tabKey)} style={styles.tab}>
          <Text style={[styles.tabLabel, activeTab === tabKey && styles.activeLabel]}>
            {labelMap[tabKey]}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}
