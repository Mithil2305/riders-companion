import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';

interface ChatHeaderProps {
  title: string;
  onBack: () => void;
  showSpinner?: boolean;
  rightMode?: 'none' | 'chat';
}

export function ChatHeader({ title, onBack, showSpinner = false, rightMode = 'none' }: ChatHeaderProps) {
  const { colors, metrics, typography } = useTheme();

  const styles = React.useMemo(
    () =>
      StyleSheet.create({
        root: {
          paddingHorizontal: metrics.md,
          paddingTop: metrics.sm,
          paddingBottom: metrics.sm,
          backgroundColor: colors.background,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        },
        row: {
          minHeight: 56,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        },
        left: {
          width: metrics.icon.lg + metrics.sm,
          height: metrics.icon.lg + metrics.sm,
          borderRadius: metrics.radius.full,
          alignItems: 'center',
          justifyContent: 'center',
        },
        title: {
          flex: 1,
          color: colors.textPrimary,
          fontSize: typography.sizes.lg,
          fontWeight: '700',
          marginLeft: metrics.sm,
        },
        titleChat: {
          textDecorationLine: 'underline',
          fontSize: typography.sizes.lg,
        },
        right: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: metrics.sm,
        },
        rightTap: {
          width: metrics.icon.lg + metrics.sm,
          height: metrics.icon.lg + metrics.sm,
          borderRadius: metrics.radius.full,
          alignItems: 'center',
          justifyContent: 'center',
        },
        spinner: {
          width: metrics.icon.lg + metrics.sm,
          height: metrics.icon.lg + metrics.sm,
          alignItems: 'center',
          justifyContent: 'center',
        },
      }),
    [colors, metrics, typography],
  );

  const isChatHeader = rightMode === 'chat';

  return (
    <View style={styles.root}>
      <View style={styles.row}>
        <Pressable android_ripple={{ color: colors.overlayLight }} onPress={onBack} style={styles.left}>
          <Ionicons color={colors.textPrimary} name="arrow-back" size={metrics.icon.lg + 2} />
        </Pressable>

        <Text numberOfLines={1} style={[styles.title, isChatHeader ? styles.titleChat : null]}>
          {title}
        </Text>

        <View style={styles.right}>
          {isChatHeader ? (
            <>
              <Pressable android_ripple={{ color: colors.overlayLight }} style={styles.rightTap}>
                <Ionicons color={colors.textPrimary} name="call-outline" size={metrics.icon.lg} />
              </Pressable>
              <Pressable android_ripple={{ color: colors.overlayLight }} style={styles.rightTap}>
                <Ionicons color={colors.textPrimary} name="videocam-outline" size={metrics.icon.lg} />
              </Pressable>
            </>
          ) : showSpinner ? (
            <View style={styles.spinner}>
              <ActivityIndicator color={colors.warning} size="small" />
            </View>
          ) : (
            <View style={styles.spinner} />
          )}
        </View>
      </View>
    </View>
  );
}