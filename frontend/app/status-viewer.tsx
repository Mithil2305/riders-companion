import React from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../src/hooks/useTheme';

export default function StatusViewerScreen() {
  const router = useRouter();
  const { colors, metrics, typography } = useTheme();

  React.useEffect(() => {
    Alert.alert(
      'Stories — Coming Soon! 🚀',
      'This feature is still being built. Stay tuned!',
      [{ text: 'OK', onPress: () => router.back() }],
    );
  }, [router]);

  const styles = React.useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          backgroundColor: colors.background,
          alignItems: 'center',
          justifyContent: 'center',
          gap: metrics.md,
        },
        text: {
          color: colors.textSecondary,
          fontSize: typography.sizes.base,
        },
      }),
    [colors, metrics, typography],
  );

  return (
    <SafeAreaView style={styles.container}>
      <Ionicons color={colors.textTertiary} name="sparkles" size={48} />
      <Text style={styles.text}>Stories coming soon!</Text>
    </SafeAreaView>
  );
}
