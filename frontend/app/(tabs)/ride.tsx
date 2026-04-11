import React from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PrimaryButton } from '../../src/components/common';
import { useTheme } from '../../src/hooks/useTheme';

export default function RideScreen() {
  const { colors, metrics, typography } = useTheme();
  const [selectedType, setSelectedType] = React.useState<'solo' | 'group'>('solo');

  const styles = React.useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          backgroundColor: colors.background,
        },
        content: {
          padding: metrics.lg,
          gap: metrics.lg,
        },
        header: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: metrics.sm,
        },
        title: {
          fontSize: typography.sizes['3xl'],
          color: colors.textPrimary,
          fontWeight: '700',
        },
        card: {
          borderRadius: metrics.radius.xl,
          borderWidth: 1,
          borderColor: colors.border,
          backgroundColor: colors.surface,
          padding: metrics.md,
          alignItems: 'center',
          gap: metrics.sm,
        },
        selectedCard: {
          borderColor: colors.primary,
        },
        rideImage: {
          width: 180,
          height: 180,
          borderRadius: metrics.radius.lg,
        },
        rideLabel: {
          color: colors.textPrimary,
          fontSize: typography.sizes.xl,
          fontWeight: '600',
        },
        rideMeta: {
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
        <View style={styles.header}>
          <Ionicons color={colors.primary} name="navigate-outline" size={24} />
          <Text style={styles.title}>Choose your ride</Text>
        </View>

        <Pressable
          onPress={() => setSelectedType('solo')}
          style={[styles.card, selectedType === 'solo' && styles.selectedCard]}
        >
          <Image source={require('../../assets/images/solo_ride.png')} style={styles.rideImage} />
          <Text style={styles.rideLabel}>Solo ride</Text>
          <Text style={styles.rideMeta}>Freedom ride with your own pace</Text>
        </Pressable>

        <Pressable
          onPress={() => setSelectedType('group')}
          style={[styles.card, selectedType === 'group' && styles.selectedCard]}
        >
          <Image source={require('../../assets/images/group_ride.png')} style={styles.rideImage} />
          <Text style={styles.rideLabel}>Group ride</Text>
          <Text style={styles.rideMeta}>Ride with community and route sync</Text>
        </Pressable>

        <PrimaryButton
          onPress={() => {}}
          title={`Start ${selectedType === 'solo' ? 'Solo' : 'Group'} Ride`}
        />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
