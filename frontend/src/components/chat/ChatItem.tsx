import React from 'react';
import { Image, Pressable, StyleSheet, Text, View, type ImageStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import { useTheme } from '../../hooks/useTheme';
import { ChatPreview } from '../../types/chat';

interface ChatItemProps {
  item: ChatPreview;
  onPress: () => void;
  onLongPress?: () => void;
}

export function ChatItem({ item, onPress, onLongPress }: ChatItemProps) {
  const { colors, metrics, typography } = useTheme();
  const badgeScale = useSharedValue(1);

  React.useEffect(() => {
    if (item.unreadCount) {
      badgeScale.value = withRepeat(withTiming(1.08, { duration: 900 }), -1, true);
    }
  }, [badgeScale, item.unreadCount]);

  const badgeAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: badgeScale.value }],
  }));

  const styles = React.useMemo(
    () =>
      StyleSheet.create({
        row: {
          minHeight: 78,
          paddingHorizontal: metrics.md,
          paddingVertical: metrics.sm,
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: colors.background,
        },
        avatarWrap: {
          width: 56,
          height: 56,
          borderRadius: 28,
          marginRight: metrics.md,
          position: 'relative',
        },
        dot: {
          position: 'absolute',
          right: 1,
          top: 1,
          width: 11,
          height: 11,
          borderRadius: metrics.radius.full,
          backgroundColor: colors.primary,
          borderWidth: 1.5,
          borderColor: colors.background,
        },
        center: {
          flex: 1,
          gap: 2,
        },
        name: {
          color: colors.textPrimary,
          fontSize: typography.sizes.lg,
          fontWeight: '700',
        },
        message: {
          color: colors.textSecondary,
          fontSize: typography.sizes.base,
          fontWeight: '500',
        },
        right: {
          alignItems: 'flex-end',
          justifyContent: 'center',
          minWidth: 44,
          gap: metrics.sm,
        },
        time: {
          color: colors.textSecondary,
          fontSize: typography.sizes.base,
          fontWeight: '500',
        },
        unreadBadge: {
          minWidth: 32,
          height: 32,
          borderRadius: metrics.radius.full,
          backgroundColor: colors.primary,
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: metrics.sm,
        },
        unreadText: {
          color: colors.textInverse,
          fontSize: typography.sizes.base,
          fontWeight: '700',
        },
        divider: {
          height: 1,
          marginLeft: 88,
          backgroundColor: colors.border,
        },
      }),
    [colors, metrics, typography],
  );

  const avatarStyle = React.useMemo<ImageStyle>(
    () => ({
      width: 56,
      height: 56,
      borderRadius: 28,
    }),
    [],
  );

  return (
    <>
      <Pressable
        android_ripple={{ color: colors.overlayLight }}
        delayLongPress={240}
        onLongPress={onLongPress}
        onPress={onPress}
        style={styles.row}
      >
        <View style={styles.avatarWrap}>
          <Image source={{ uri: item.avatar }} style={avatarStyle} />
          {item.hasUnreadDot ? <View style={styles.dot} /> : null}
        </View>

        <View style={styles.center}>
          <Text numberOfLines={1} style={styles.name}>
            {item.name}
          </Text>
          <Text numberOfLines={1} style={styles.message}>
            {item.message}
          </Text>
        </View>

        <View style={styles.right}>
          <Text style={styles.time}>{item.time}</Text>
          {item.unreadCount ? (
            <Animated.View style={[styles.unreadBadge, badgeAnimatedStyle]}>
              <Text style={styles.unreadText}>{item.unreadCount}</Text>
            </Animated.View>
          ) : null}
        </View>
      </Pressable>
      <View style={styles.divider} />
    </>
  );
}