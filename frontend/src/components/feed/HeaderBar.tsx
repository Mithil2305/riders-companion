import React from 'react';
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, View, type ImageSourcePropType } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '../../hooks/useTheme';


interface HeaderBarProps {
  title?: string;
  titleIcon?: ImageSourcePropType;
  showSpinner?: boolean;
}

export function HeaderBar({ title = 'Moments', titleIcon, showSpinner = false }: HeaderBarProps) {
  const { colors, metrics, typography } = useTheme();
  const router = useRouter();

  const styles = React.useMemo(
    () =>
      StyleSheet.create({
        root: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: metrics.md,
          paddingTop: metrics.sm,
          paddingBottom: metrics.sm,
          backgroundColor: colors.background,
          borderBottomWidth: 1,
          borderBottomColor: colors.borderDark,
        },
        left: {
          flexDirection: 'row',
          alignItems: 'center',
        },
        title: {
          color: colors.textPrimary,
          fontSize: typography.sizes.lg,
          fontWeight: '700',
          letterSpacing: 0.2,
        },
        right: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: metrics.md,
        },
        iconTap: {
          alignItems: 'center',
          justifyContent: 'center',
          opacity: 0.9,
        },
        addCircle: {
          width: metrics.icon.md,
          height: metrics.icon.md,
          borderRadius: metrics.radius.full,
          borderWidth: 1.6,
          borderColor: colors.icon,
          alignItems: 'center',
          justifyContent: 'center',
        },
        spinnerWrap: {
          position: 'absolute',
          top: metrics.xs,
          left: 0,
          right: 0,
          alignItems: 'center',
        },
      }),
    [colors, metrics, typography],
  );

  return (
    <View style={styles.root}>
      {showSpinner ? (
        <View style={styles.spinnerWrap}>
          <ActivityIndicator color={colors.spinnerHead} size="small" />
        </View>
      ) : null}

      <View style={styles.left}>
        {titleIcon ? <Image source={titleIcon} style={{ width: 20, height: 20, marginRight: metrics.sm }} /> : null}
        <Text style={styles.title}>{title}</Text>
      </View>

      <View style={styles.right}>
        <Pressable android_ripple={{ color: colors.overlayLight }} onPress={() => router.push('/status')} style={styles.iconTap}>
            <MaterialCommunityIcons color={colors.icon} name="clock-plus-outline" size={metrics.icon.md - 2}/>
        </Pressable>

        <Pressable android_ripple={{ color: colors.overlayLight }} style={styles.iconTap}>
          <Ionicons color={colors.icon} name="people-outline" size={metrics.icon.md - 2} />
        </Pressable>

        <Pressable
          android_ripple={{ color: colors.overlayLight }}
          onPress={() => router.push('/room/1')}
          style={styles.iconTap}
        >
          <Ionicons color={colors.icon} name="chatbubble-outline" size={metrics.icon.md - 2} />
        </Pressable>

        <Pressable
          android_ripple={{ color: colors.overlayLight }}
          onPress={() => router.push('/notifications')}
          style={styles.iconTap}
        >
          <Ionicons color={colors.icon} name="notifications-outline" size={metrics.icon.md - 2} />
        </Pressable>
      </View>
    </View>
  );
}
