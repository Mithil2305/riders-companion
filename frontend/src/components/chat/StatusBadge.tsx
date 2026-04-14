import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { ChatStatus } from '../../types/chat';

interface StatusBadgeProps {
  status: ChatStatus;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const { colors, metrics, typography } = useTheme();
  const isActive = status === 'active';

  const styles = React.useMemo(
    () =>
      StyleSheet.create({
        badge: {
          minHeight: 20,
          borderRadius: metrics.radius.md,
          borderWidth: 1,
          paddingHorizontal: metrics.sm,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: isActive ? colors.chatActiveBadgeBg : colors.chatEndedBadgeBg,
          borderColor: isActive ? colors.chatActiveBadgeBorder : colors.chatEndedBadgeBorder,
        },
        row: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 4,
        },
        dot: {
          width: 6,
          height: 6,
          borderRadius: metrics.radius.full,
          backgroundColor: isActive ? colors.chatActiveBadgeText : colors.chatEndedBadgeText,
        },
        text: {
          color: isActive ? colors.chatActiveBadgeText : colors.chatEndedBadgeText,
          fontSize: typography.sizes.xs,
          fontWeight: '500',
          letterSpacing: 0.3,
          textTransform: 'uppercase',
        },
      }),
    [colors, isActive, metrics, typography],
  );

  return (
    <View style={styles.badge}>
      <View style={styles.row}>
        {isActive ? <View style={styles.dot} /> : null}
        <Text style={styles.text}>{isActive ? 'Active Ride' : 'Trip Ended'}</Text>
      </View>
    </View>
  );
}
