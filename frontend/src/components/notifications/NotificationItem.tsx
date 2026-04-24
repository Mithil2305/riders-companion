import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  FadeInDown,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { AppNotification, NotificationType } from '../../types/notifications';
import { useTheme } from '../../hooks/useTheme';

interface NotificationItemProps {
  item: AppNotification;
  index: number;
  onDismiss: (id: string) => void;
  onPress: (id: string) => void;
}

const TYPE_ICON: Record<NotificationType, React.ComponentProps<typeof Ionicons>['name']> = {
  ALERT: 'warning-outline',
  SOCIAL: 'heart-outline',
  SYSTEM: 'settings-outline',
};

const TYPE_COLOR_TOKEN: Record<NotificationType, 'error' | 'primary' | 'info'> = {
  ALERT: 'error',
  SOCIAL: 'primary',
  SYSTEM: 'info',
};

export function NotificationItem({ item, index, onDismiss, onPress }: NotificationItemProps) {
  const { colors, metrics, typography } = useTheme();
  const translateX = useSharedValue(0);
  const rowOpacity = useSharedValue(1);

  const styles = React.useMemo(
    () =>
      StyleSheet.create({
        card: {
          borderRadius: metrics.radius.xl,
          borderWidth: 1,
          borderColor: item.read ? colors.borderDark : colors.primary,
          backgroundColor: item.read ? colors.card : colors.surface,
          padding: metrics.md,
          flexDirection: 'row',
          alignItems: 'flex-start',
          gap: metrics.md,
          minHeight: 84,
        },
        iconWrap: {
          width: 44,
          height: 44,
          borderRadius: metrics.radius.full,
          backgroundColor: colors.background,
          alignItems: 'center',
          justifyContent: 'center',
          borderWidth: 1,
          borderColor: colors.border,
        },
        content: {
          flex: 1,
          gap: metrics.xs,
        },
        titleRow: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: metrics.sm,
        },
        title: {
          color: item.read ? colors.textSecondary : colors.textPrimary,
          fontSize: typography.sizes.base,
          fontWeight: '700',
          flex: 1,
        },
        message: {
          color: item.read ? colors.textTertiary : colors.textSecondary,
          fontSize: typography.sizes.sm,
          lineHeight: typography.sizes.sm * typography.lineHeights.relaxed,
        },
        time: {
          color: colors.textTertiary,
          fontSize: typography.sizes.xs,
          fontWeight: '600',
        },
      }),
    [colors, item.read, metrics, typography],
  );

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
    opacity: rowOpacity.value,
  }));

  const dismissRow = React.useCallback(() => {
    onDismiss(item.id);
  }, [item.id, onDismiss]);

  const pan = Gesture.Pan()
    .activeOffsetX([-12, 12])
    .onUpdate((event) => {
      if (event.translationX < 0) {
        translateX.value = event.translationX;
      }
    })
    .onEnd(() => {
      if (translateX.value < -100) {
        translateX.value = withTiming(-420, { duration: 180 });
        rowOpacity.value = withTiming(0, { duration: 160 }, () => {
          runOnJS(dismissRow)();
        });
      } else {
        translateX.value = withTiming(0, { duration: 180 });
      }
    });

  return (
    <Animated.View entering={FadeInDown.delay(index * 70).duration(260)}>
      <GestureDetector gesture={pan}>
        <Animated.View style={animatedStyle}>
          <Pressable onPress={() => onPress(item.id)} style={styles.card}>
            <View style={styles.iconWrap}>
              <Ionicons
                color={colors[TYPE_COLOR_TOKEN[item.type]]}
                name={TYPE_ICON[item.type]}
                size={metrics.icon.md}
              />
            </View>
            <View style={styles.content}>
              <View style={styles.titleRow}>
                <Text style={styles.title}>{item.title}</Text>
                <Text style={styles.time}>{item.time}</Text>
              </View>
              <Text style={styles.message}>{item.message}</Text>
            </View>
          </Pressable>
        </Animated.View>
      </GestureDetector>
    </Animated.View>
  );
}
