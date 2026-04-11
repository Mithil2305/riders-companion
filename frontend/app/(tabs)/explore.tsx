import React from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../src/hooks/useTheme';

export default function ExploreScreen() {
  const { colors, metrics, typography } = useTheme();
  const styles = React.useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          backgroundColor: colors.background,
        },
        content: {
          padding: metrics.md,
          gap: metrics.md,
        },
        titleRow: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: metrics.sm,
        },
        title: {
          fontSize: typography.sizes.xl,
          color: colors.textPrimary,
          fontWeight: '700',
        },
        searchBar: {
          minHeight: 50,
          borderRadius: metrics.radius.full,
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.border,
          paddingHorizontal: metrics.md,
          flexDirection: 'row',
          alignItems: 'center',
          gap: metrics.sm,
        },
        searchPlaceholder: {
          color: colors.textTertiary,
          fontSize: typography.sizes.base,
        },
        chipRow: {
          flexDirection: 'row',
          gap: metrics.sm,
        },
        chip: {
          minHeight: 42,
          borderRadius: metrics.radius.full,
          paddingHorizontal: metrics.md,
          justifyContent: 'center',
          borderWidth: 1,
          borderColor: colors.border,
          backgroundColor: colors.surface,
        },
        chipActive: {
          backgroundColor: colors.primary,
          borderColor: colors.primary,
        },
        chipText: {
          color: colors.textSecondary,
          fontSize: typography.sizes.base,
          fontWeight: '500',
        },
        chipTextActive: {
          color: colors.textInverse,
          fontWeight: '700',
        },
        riderCard: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingVertical: metrics.sm,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        },
        riderLeft: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: metrics.sm,
        },
        riderAvatar: {
          width: 48,
          height: 48,
          borderRadius: 24,
        },
        riderName: {
          color: colors.textPrimary,
          fontSize: typography.sizes.lg,
          fontWeight: '600',
        },
        riderMeta: {
          color: colors.textSecondary,
          fontSize: typography.sizes.base,
        },
      }),
    [colors, metrics, typography],
  );

  return (
    <SafeAreaView edges={['left', 'right']} style={styles.container}>
      <ScrollView style={styles.container}>
        <View style={styles.content}>
        <View style={styles.titleRow}>
          <Ionicons color={colors.primary} name="search-outline" size={22} />
          <Text style={styles.title}>Search</Text>
        </View>

        <View style={styles.searchBar}>
          <Ionicons color={colors.textTertiary} name="search-outline" size={20} />
          <Text style={styles.searchPlaceholder}>Find riders and moments</Text>
        </View>

        <View style={styles.chipRow}>
          <Pressable style={[styles.chip, styles.chipActive]}>
            <Text style={[styles.chipText, styles.chipTextActive]}>Mutual</Text>
          </Pressable>
          <Pressable style={styles.chip}>
            <Text style={styles.chipText}>New</Text>
          </Pressable>
          <Pressable style={styles.chip}>
            <Text style={styles.chipText}>Group</Text>
          </Pressable>
        </View>

        {['Cameron Williamson', 'Annette Black', 'Marvin McKinney', 'Brooklyn Simmons'].map(
          (name, index) => (
            <View key={name} style={styles.riderCard}>
              <View style={styles.riderLeft}>
                <Image source={require('../../assets/images/solo_ride.png')} style={styles.riderAvatar} />
                <View>
                  <Text style={styles.riderName}>{name}</Text>
                  <Text style={styles.riderMeta}>{index % 2 === 0 ? 'How are you' : 'Available for rides'}</Text>
                </View>
              </View>
              <Ionicons color={colors.primary} name="chevron-forward" size={18} />
            </View>
          ),
        )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
