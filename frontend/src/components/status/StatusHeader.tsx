import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';

interface StatusHeaderProps {
  title?: string;
  showSpinner?: boolean;
  onClose: () => void;
}

export function StatusHeader({ title = 'Status', showSpinner = false, onClose }: StatusHeaderProps) {
  const { colors, metrics, typography } = useTheme();

  const styles = React.useMemo(
    () =>
      StyleSheet.create({
        root: {
          paddingHorizontal: metrics.md,
          paddingTop: metrics.md,
          paddingBottom: metrics.sm,
          backgroundColor: colors.background,
        },
        row: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          minHeight: 52,
        },
        titleWrap: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: metrics.sm,
        },
        titleIcon: {
          width: metrics.icon.lg,
          height: metrics.icon.lg,
          borderRadius: metrics.radius.full,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colors.overlayLight,
        },
        title: {
          color: colors.textPrimary,
          fontSize: typography.sizes.lg,
          fontWeight: '700',
          letterSpacing: 0.2,
        },
        closeBtn: {
          width: metrics.icon.lg + metrics.sm,
          height: metrics.icon.lg + metrics.sm,
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: metrics.radius.full,
        },
        spinner: {
          position: 'absolute',
          right: metrics.md,
          top: metrics.xs,
        },
      }),
    [colors, metrics, typography],
  );

  return (
    <View style={styles.root}>
      {showSpinner ? (
        <View style={styles.spinner}>
          <ActivityIndicator color={colors.warning} size="small" />
        </View>
      ) : null}

      <View style={styles.row}>
        <View style={styles.titleWrap}>
          <View style={styles.titleIcon}>
            <MaterialCommunityIcons color={colors.primary} name="clock-plus-outline" size={metrics.icon.md} />
          </View>
          <Text style={styles.title}>{title}</Text>
        </View>

        <Pressable android_ripple={{ color: colors.overlayLight }} onPress={onClose} style={styles.closeBtn}>
          <Ionicons color={colors.textPrimary} name="close" size={metrics.icon.lg + 2} />
        </Pressable>
      </View>
    </View>
  );
}
