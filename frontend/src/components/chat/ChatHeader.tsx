import React from 'react';
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';

interface ChatHeaderProps {
  onBack: () => void;
  title: string;
  showSpinner?: boolean;
  rightMode?: 'none' | 'chat' | 'menu';
  accentBack?: boolean;
  avatarUri?: string;
  statusLabel?: string;
  rideLabel?: string;
  isOnline?: boolean;
  onPressMenu?: () => void;
}

export function ChatHeader({
  title,
  onBack,
  showSpinner = false,
  rightMode = 'menu',
  accentBack = false,
  avatarUri,
  statusLabel,
  rideLabel,
  isOnline = false,
  onPressMenu,
}: ChatHeaderProps) {
  const { colors, metrics, typography } = useTheme();

  const styles = React.useMemo(
    () =>
      StyleSheet.create({
        root: {
          paddingHorizontal: metrics.md,
          paddingTop: metrics.xs,
          paddingBottom: metrics.xs + 2,
          backgroundColor: colors.chatHeaderBackground,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        },
        row: {
          minHeight: 56,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        },
        left: {
          width: metrics.icon.lg + metrics.sm - 2,
          height: metrics.icon.lg + metrics.sm - 2,
          borderRadius: metrics.radius.full,
          alignItems: 'center',
          justifyContent: 'center',
        },
        titleWrap: {
          flex: 1,
          marginLeft: metrics.md,
          justifyContent: 'center',
        },
        title: {
          color: colors.textPrimary,
          fontSize: typography.sizes.lg,
          fontWeight: '700',
          letterSpacing: 0,
        },
        subtitle: {
          marginTop: 2,
          color: colors.chatOnline,
          fontSize: typography.sizes.sm,
          fontWeight: '500',
        },
        avatarWrap: {
          width: 50,
          height: 50,
          borderRadius: metrics.radius.full,
          alignItems: 'center',
          justifyContent: 'center',
          marginLeft: metrics.sm,
        },
        avatar: {
          width: 50,
          height: 50,
          borderRadius: metrics.radius.full,
        },
        onlineDot: {
          position: 'absolute',
          right: 1,
          bottom: 1,
          width: 12,
          height: 12,
          borderRadius: metrics.radius.full,
          borderWidth: 2,
          borderColor: colors.chatHeaderBackground,
          backgroundColor: colors.chatOnline,
        },
        routeBadge: {
          marginTop: metrics.sm,
          alignSelf: 'center',
          borderRadius: metrics.radius.full,
          borderWidth: 1,
          borderColor: colors.border,
          backgroundColor: colors.chatRouteBadgeBackground,
          paddingHorizontal: metrics.md,
          paddingVertical: metrics.xs + 1,
        },
        routeText: {
          color: colors.textSecondary,
          fontSize: typography.sizes.sm,
          fontWeight: '500',
          letterSpacing: 0.25,
          textTransform: 'uppercase',
        },
        right: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: metrics.sm,
        },
        rightTap: {
          width: metrics.icon.lg + metrics.sm,
          height: metrics.icon.lg + metrics.sm,
          borderRadius: metrics.radius.full,
          alignItems: 'center',
          justifyContent: 'center',
        },
        spinner: {
          width: metrics.icon.lg + metrics.sm,
          height: metrics.icon.lg + metrics.sm,
          alignItems: 'center',
          justifyContent: 'center',
        },
      }),
    [colors, metrics, typography],
  );

  const isPersonalHeader = Boolean(avatarUri);
  const isMenuHeader = rightMode === 'menu';

  return (
    <View style={styles.root}>
      <View style={styles.row}>
        <Pressable android_ripple={{ color: colors.overlayLight }} onPress={onBack} style={styles.left}>
          <Ionicons
            color={accentBack ? colors.primary : colors.textPrimary}
            name="arrow-back"
            size={metrics.icon.lg - 6}
          />
        </Pressable>

        {isPersonalHeader ? (
          <>
            <View style={styles.avatarWrap}>
              <Image source={{ uri: avatarUri }} style={styles.avatar} />
              {isOnline ? <View style={styles.onlineDot} /> : null}
            </View>
            <View style={styles.titleWrap}>
              <Text numberOfLines={1} style={styles.title}>
                {title}
              </Text>
              <Text style={styles.subtitle}>{statusLabel ?? 'Offline'}</Text>
            </View>
          </>
        ) : (
          <View style={styles.titleWrap}>
            <Text numberOfLines={1} style={[styles.title, { textTransform: isMenuHeader ? 'uppercase' : 'none' }]}>
              {title}
            </Text>
          </View>
        )}

        <View style={styles.right}>
          {isPersonalHeader ? (
            showSpinner ? (
              <View style={styles.spinner}>
                <ActivityIndicator color={colors.warning} size="small" />
              </View>
            ) : (
              <Pressable android_ripple={{ color: colors.overlayLight }} onPress={onPressMenu} style={styles.rightTap}>
                <Ionicons color={colors.icon} name="ellipsis-vertical" size={metrics.icon.md + 2} />
              </Pressable>
            )
          ) : isMenuHeader ? (
            <Pressable android_ripple={{ color: colors.overlayLight }} style={styles.rightTap}>
              <Ionicons color={colors.icon} name="ellipsis-vertical" size={metrics.icon.md - 1} />
            </Pressable>
          ) : showSpinner ? (
            <View style={styles.spinner}>
              <ActivityIndicator color={colors.warning} size="small" />
            </View>
          ) : (
            <View style={styles.spinner} />
          )}
        </View>
      </View>

      {isPersonalHeader ? (
        <View style={styles.routeBadge}>
          <Text numberOfLines={1} style={styles.routeText}>
            {metaRouteText(rideLabel)}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

function metaRouteText(subtitle?: string) {
  if (!subtitle || subtitle.trim().length === 0) {
    return 'YOU RODE TOGETHER';
  }

  if (subtitle.toUpperCase().startsWith('YOU RODE')) {
    return subtitle;
  }

  return `YOU RODE TOGETHER ON: ${subtitle}`;
}