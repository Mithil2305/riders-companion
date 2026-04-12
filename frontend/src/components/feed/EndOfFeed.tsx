import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../hooks/useTheme';

export function EndOfFeed() {
  const { colors, metrics, typography } = useTheme();

  const styles = React.useMemo(
    () =>
      StyleSheet.create({
        wrap: {
          paddingVertical: metrics.lg,
          alignItems: 'center',
        },
        text: {
          color: colors.textTertiary,
          fontSize: typography.sizes.sm,
          textAlign: 'center',
        },
      }),
    [colors, metrics, typography],
  );

  return (
    <View style={styles.wrap}>
      <Text style={styles.text}>- End of tracked users' posts -</Text>
    </View>
  );
}
