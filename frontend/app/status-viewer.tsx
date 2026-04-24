import React from 'react';
import { ImageBackground, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTheme } from '../src/hooks/useTheme';

const FALLBACK_AVATAR = 'https://i.pravatar.cc/600?img=26';

export default function StatusViewerScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ name?: string; avatar?: string; time?: string }>();
  const { colors, metrics, typography } = useTheme();

  const name = params.name ?? 'Status';
  const avatar = params.avatar ?? FALLBACK_AVATAR;
  const time = params.time ?? 'Just now';

  const styles = React.useMemo(
    () =>
      StyleSheet.create({
        safeArea: {
          flex: 1,
          backgroundColor: '#080808',
        },
        content: {
          flex: 1,
          justifyContent: 'space-between',
        },
        image: {
          flex: 1,
          justifyContent: 'space-between',
        },
        top: {
          paddingHorizontal: metrics.md,
          paddingTop: metrics.sm,
          gap: metrics.md,
        },
        progressWrap: {
          flexDirection: 'row',
          gap: metrics.xs,
        },
        progressItem: {
          flex: 1,
          height: 3,
          borderRadius: metrics.radius.full,
          backgroundColor: 'rgba(255, 255, 255, 0.35)',
        },
        progressActive: {
          backgroundColor: '#FFFFFF',
        },
        profileRow: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        },
        profileLeft: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: metrics.sm,
        },
        avatar: {
          width: 38,
          height: 38,
          borderRadius: metrics.radius.full,
          borderWidth: 1,
          borderColor: 'rgba(255,255,255,0.5)',
        },
        name: {
          color: '#FFFFFF',
          fontSize: typography.sizes.base,
          fontWeight: '700',
        },
        time: {
          color: 'rgba(255,255,255,0.82)',
          fontSize: typography.sizes.sm,
          fontWeight: '500',
        },
        closeBtn: {
          width: metrics.icon.lg + metrics.sm,
          height: metrics.icon.lg + metrics.sm,
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: metrics.radius.full,
          backgroundColor: 'rgba(0,0,0,0.36)',
        },
        bottomShade: {
          paddingHorizontal: metrics.lg,
          paddingBottom: metrics['2xl'],
          paddingTop: metrics.lg,
          backgroundColor: 'rgba(0, 0, 0, 0.35)',
        },
        caption: {
          color: '#FFFFFF',
          fontSize: typography.sizes.lg,
          fontWeight: '600',
        },
      }),
    [colors, metrics, typography],
  );

  return (
    <SafeAreaView edges={['top', 'left', 'right', 'bottom']} style={styles.safeArea}>
      <ImageBackground blurRadius={2} source={{ uri: avatar }} style={styles.image}>
        <View style={styles.content}>
          <View style={styles.top}>
            <View style={styles.progressWrap}>
              <View style={[styles.progressItem, styles.progressActive]} />
              <View style={styles.progressItem} />
              <View style={styles.progressItem} />
            </View>

            <View style={styles.profileRow}>
              <View style={styles.profileLeft}>
                <ImageBackground source={{ uri: avatar }} style={styles.avatar} />
                <View>
                  <Text style={styles.name}>{name}</Text>
                  <Text style={styles.time}>{time}</Text>
                </View>
              </View>

              <Pressable android_ripple={{ color: colors.overlayLight }} onPress={() => router.back()} style={styles.closeBtn}>
                <Ionicons color="#FFFFFF" name="close" size={metrics.icon.md} />
              </Pressable>
            </View>
          </View>

          <View style={styles.bottomShade}>
            <Text style={styles.caption}>Ride update</Text>
          </View>
        </View>
      </ImageBackground>
    </SafeAreaView>
  );
}
