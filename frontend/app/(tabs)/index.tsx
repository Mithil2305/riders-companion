import React from 'react';
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../src/hooks/useTheme';

export default function HomeScreen() {
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
        headerRow: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
        },
        titleWrap: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: metrics.sm,
        },
        title: {
          fontSize: typography.sizes.xl,
          color: colors.textPrimary,
          fontWeight: '700',
        },
        subtitle: {
          color: colors.textSecondary,
          fontSize: typography.sizes.sm,
        },
        actionRow: {
          flexDirection: 'row',
          gap: metrics.sm,
        },
        iconButton: {
          width: 36,
          height: 36,
          borderRadius: 18,
          backgroundColor: colors.surface,
          alignItems: 'center',
          justifyContent: 'center',
        },
        card: {
          borderRadius: metrics.radius.xl,
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.border,
          overflow: 'hidden',
        },
        riderRow: {
          padding: metrics.md,
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
        },
        riderName: {
          color: colors.textPrimary,
          fontSize: typography.sizes.base,
          fontWeight: '600',
        },
        riderTime: {
          color: colors.textTertiary,
          fontSize: typography.sizes.xs,
        },
        postImage: {
          width: '100%',
          height: 270,
        },
        statRow: {
          paddingHorizontal: metrics.md,
          paddingVertical: metrics.sm,
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
        },
        statText: {
          color: colors.textSecondary,
          fontSize: typography.sizes.sm,
        },
      }),
    [colors, metrics, typography],
  );

  return (
    <SafeAreaView edges={['left', 'right']} style={styles.container}>
      <ScrollView style={styles.container}>
        <View style={styles.content}>
        <View style={styles.headerRow}>
          <View>
            <View style={styles.titleWrap}>
              <Ionicons color={colors.primary} name="flash-outline" size={20} />
              <Text style={styles.title}>Moments</Text>
            </View>
            <Text style={styles.subtitle}>Trackers and ride stories</Text>
          </View>
          <View style={styles.actionRow}>
            <View style={styles.iconButton}>
              <Ionicons color={colors.icon} name="notifications-outline" size={18} />
            </View>
            <View style={styles.iconButton}>
              <Ionicons color={colors.icon} name="chatbubble-ellipses-outline" size={18} />
            </View>
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.riderRow}>
            <View>
              <Text style={styles.riderName}>alex_rider</Text>
              <Text style={styles.riderTime}>2h</Text>
            </View>
            <Ionicons color={colors.primary} name="ellipsis-horizontal" size={18} />
          </View>
          <Image source={require('../../assets/images/hero.png')} style={styles.postImage} />
          <View style={styles.statRow}>
            <Text style={styles.statText}>142 bumps</Text>
            <Ionicons color={colors.primary} name="heart-outline" size={20} />
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.riderRow}>
            <View>
              <Text style={styles.riderName}>moto_john</Text>
              <Text style={styles.riderTime}>5h</Text>
            </View>
            <Ionicons color={colors.primary} name="ellipsis-horizontal" size={18} />
          </View>
          <Image source={require('../../assets/images/group_ride.png')} style={styles.postImage} />
          <View style={styles.statRow}>
            <Text style={styles.statText}>120 bumps</Text>
            <Ionicons color={colors.primary} name="heart-outline" size={20} />
          </View>
        </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
