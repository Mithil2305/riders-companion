import React from 'react';
import { Image, StyleSheet, Text, TextInput, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../src/hooks/useTheme';

export default function RoomScreen() {
  const { colors, metrics, typography } = useTheme();
  const { id } = useLocalSearchParams();
  const styles = React.useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          backgroundColor: colors.background,
        },
        header: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: metrics.md,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
          backgroundColor: colors.surface,
        },
        headerLeft: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: metrics.sm,
        },
        avatar: {
          width: 36,
          height: 36,
          borderRadius: 18,
        },
        title: {
          color: colors.textPrimary,
          fontSize: typography.sizes.lg,
          fontWeight: '700',
        },
        sub: {
          color: colors.textSecondary,
          fontSize: typography.sizes.xs,
        },
        body: {
          flex: 1,
          padding: metrics.md,
          gap: metrics.md,
        },
        bubble: {
          maxWidth: '76%',
          padding: metrics.md,
          borderRadius: metrics.radius.xl,
        },
        bubbleIn: {
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.border,
          alignSelf: 'flex-start',
        },
        bubbleOut: {
          backgroundColor: colors.primary,
          alignSelf: 'flex-end',
        },
        bubbleTextIn: {
          color: colors.textPrimary,
          fontSize: typography.sizes.base,
        },
        bubbleTextOut: {
          color: colors.textInverse,
          fontSize: typography.sizes.base,
        },
        composer: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: metrics.sm,
          padding: metrics.md,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          backgroundColor: colors.surface,
        },
        input: {
          flex: 1,
          minHeight: 46,
          borderRadius: metrics.radius.full,
          backgroundColor: colors.background,
          borderWidth: 1,
          borderColor: colors.border,
          color: colors.textPrimary,
          paddingHorizontal: metrics.md,
        },
      }),
    [colors, metrics, typography],
  );

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Image source={require('../../assets/stickers/online-training.png')} style={styles.avatar} />
          <View>
            <Text style={styles.title}>Ride Room</Text>
            <Text style={styles.sub}>Room {id as string}</Text>
          </View>
        </View>
        <Ionicons color={colors.primary} name="call-outline" size={22} />
      </View>

      <View style={styles.body}>
        <View style={[styles.bubble, styles.bubbleIn]}>
          <Text style={styles.bubbleTextIn}>Hey! How are you?</Text>
        </View>
        <View style={[styles.bubble, styles.bubbleOut]}>
          <Text style={styles.bubbleTextOut}>All good! Working on the project.</Text>
        </View>
      </View>

      <View style={styles.composer}>
        <Ionicons color={colors.icon} name="happy-outline" size={24} />
        <TextInput placeholder="Message..." placeholderTextColor={colors.textTertiary} style={styles.input} />
        <Ionicons color={colors.primary} name="send" size={22} />
      </View>
    </SafeAreaView>
  );
}
