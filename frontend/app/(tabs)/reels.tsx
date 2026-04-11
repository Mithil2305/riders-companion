import React from 'react';
import { FlatList, Image, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../src/hooks/useTheme';
import { mockTrendingClips } from '../../src/utils/mocks/explore';

export default function ReelsScreen() {
  const { colors, metrics, typography } = useTheme();

  const styles = React.useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          backgroundColor: colors.background,
        },
        content: {
          paddingHorizontal: metrics.md,
          paddingTop: metrics.md,
          paddingBottom: metrics['2xl'],
        },
        header: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: metrics.sm,
          marginBottom: metrics.md,
        },
        title: {
          color: colors.textPrimary,
          fontSize: typography.sizes.xl,
          fontWeight: '700',
        },
        card: {
          borderRadius: metrics.radius.xl,
          overflow: 'hidden',
          borderWidth: 1,
          borderColor: colors.border,
          backgroundColor: colors.card,
          marginBottom: metrics.md,
        },
        media: {
          width: '100%',
          height: metrics.screenWidth * 1.1,
        },
        overlay: {
          position: 'absolute',
          right: metrics.md,
          top: metrics.md,
          width: 36,
          height: 36,
          borderRadius: metrics.radius.full,
          backgroundColor: colors.overlay,
          alignItems: 'center',
          justifyContent: 'center',
        },
        caption: {
          color: colors.textPrimary,
          fontSize: typography.sizes.base,
          fontWeight: '600',
          padding: metrics.md,
        },
      }),
    [colors, metrics, typography],
  );

  return (
    <SafeAreaView edges={['left', 'right']} style={styles.container}>
      <FlatList
        ListHeaderComponent={
          <View style={styles.header}>
            <Ionicons color={colors.primary} name="film-outline" size={metrics.icon.md} />
            <Text style={styles.title}>Reels</Text>
          </View>
        }
        contentContainerStyle={styles.content}
        data={mockTrendingClips}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Image source={{ uri: item.thumbnail }} style={styles.media} />
            <View style={styles.overlay}>
              <Ionicons color={colors.textInverse} name="play" size={metrics.icon.md} />
            </View>
            <Text style={styles.caption}>{item.title}</Text>
          </View>
        )}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}
