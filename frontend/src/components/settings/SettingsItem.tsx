import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useTheme } from '../../hooks/useTheme';

interface SettingsItemProps {
  title: string;
  subtitle: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  danger?: boolean;
  rightContent?: React.ReactNode;
  onPress?: () => void;
  index?: number;
}

export function SettingsItem({
  title,
  subtitle,
  icon,
  danger = false,
  rightContent,
  onPress,
  index = 0,
}: SettingsItemProps) {
  const { colors, metrics, typography } = useTheme();

  const styles = React.useMemo(
    () =>
      StyleSheet.create({
        root: {
          minHeight: 72,
          borderRadius: metrics.radius.xl,
          borderWidth: 1,
          borderColor: danger ? colors.error : colors.border,
          backgroundColor: colors.card,
          paddingHorizontal: metrics.md,
          paddingVertical: metrics.sm,
          flexDirection: 'row',
          alignItems: 'center',
          gap: metrics.md,
        },
        iconWrap: {
          width: 46,
          height: 46,
          borderRadius: metrics.radius.lg,
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: danger ? colors.error : colors.border,
          alignItems: 'center',
          justifyContent: 'center',
        },
        body: {
          flex: 1,
          gap: 2,
        },
        title: {
          color: danger ? colors.error : colors.textPrimary,
          fontSize: typography.sizes.base,
          fontWeight: '700',
        },
        subtitle: {
          color: colors.textSecondary,
          fontSize: typography.sizes.sm,
        },
      }),
    [colors, danger, metrics, typography],
  );

  return (
    <Animated.View entering={FadeInDown.delay(index * 70).duration(280)}>
      <Pressable onPress={onPress} style={styles.root}>
        <View style={styles.iconWrap}>
          <Ionicons color={danger ? colors.error : colors.primary} name={icon} size={metrics.icon.md} />
        </View>
        <View style={styles.body}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
        </View>
        {rightContent ?? <Ionicons color={colors.textTertiary} name="chevron-forward" size={metrics.icon.md} />}
      </Pressable>
    </Animated.View>
  );
}
