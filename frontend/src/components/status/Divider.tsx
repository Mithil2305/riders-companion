import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useTheme } from '../../hooks/useTheme';

export function Divider() {
  const { colors } = useTheme();

  const styles = React.useMemo(
    () =>
      StyleSheet.create({
        line: {
          height: 1,
          backgroundColor: colors.border,
          opacity: 0.72,
        },
      }),
    [colors],
  );

  return <View style={styles.line} />;
}
