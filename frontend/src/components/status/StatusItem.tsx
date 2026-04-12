import React from 'react';
import { Animated, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { StatusRingType } from '../../types/status';

interface StatusItemProps {
  name: string;
  time: string;
  avatar: string;
  ringType?: StatusRingType;
  showAddBadge?: boolean;
  onPress?: () => void;
  onLongPress?: () => void;
  onPressAdd?: () => void;
}

export function StatusItem({
  name,
  time,
  avatar,
  ringType = 'none',
  showAddBadge = false,
  onPress,
  onLongPress,
  onPressAdd,
}: StatusItemProps) {
  const { colors, metrics, typography } = useTheme();
  const pulse = React.useRef(new Animated.Value(1)).current;

  React.useEffect(() => {
    if (ringType !== 'new') {
      pulse.setValue(1);
      return;
    }

    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1.02,
          duration: 680,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 1,
          duration: 680,
          useNativeDriver: true,
        }),
      ]),
    );

    pulseLoop.start();

    return () => {
      pulseLoop.stop();
    };
  }, [pulse, ringType]);

  const ringColor = React.useMemo(() => {
    if (ringType === 'new') {
      return colors.primary;
    }

    if (ringType === 'viewed' || ringType === 'muted') {
      return colors.borderDark;
    }

    return colors.border;
  }, [colors, ringType]);

  const styles = React.useMemo(
    () =>
      StyleSheet.create({
        row: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: metrics.md,
          paddingVertical: metrics.sm,
        },
        avatarWrap: {
          width: 60,
          height: 60,
          borderRadius: metrics.radius.full,
          borderWidth: ringType === 'new' ? 2.6 : 2,
          borderColor: ringColor,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colors.surface,
        },
        avatar: {
          width: 52,
          height: 52,
          borderRadius: metrics.radius.full,
        },
        textWrap: {
          flex: 1,
        },
        title: {
          color: colors.textPrimary,
          fontSize: typography.sizes.lg,
          fontWeight: '700',
        },
        subtitle: {
          marginTop: 2,
          color: colors.textSecondary,
          fontSize: typography.sizes.base,
          fontWeight: '400',
        },
        addBadge: {
          position: 'absolute',
          right: -2,
          bottom: -1,
          width: 28,
          height: 28,
          borderRadius: metrics.radius.full,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colors.primary,
          borderWidth: 2,
          borderColor: colors.background,
        },
      }),
    [colors, metrics, ringColor, ringType, typography],
  );

  return (
    <Pressable android_ripple={{ color: colors.overlayLight }} onLongPress={onLongPress} onPress={onPress}>
      <View style={styles.row}>
        <Animated.View style={{ transform: [{ scale: pulse }] }}>
          <View style={styles.avatarWrap}>
            <Image source={{ uri: avatar }} style={styles.avatar} />
            {showAddBadge ? (
              <Pressable
                android_ripple={{ color: colors.overlayLight }}
                onPress={onPressAdd ?? onPress}
                style={({ pressed }) => [styles.addBadge, pressed ? { transform: [{ scale: 0.9 }] } : null]}
              >
                <Ionicons color={colors.textInverse} name="add" size={metrics.icon.sm + 2} />
              </Pressable>
            ) : null}
          </View>
        </Animated.View>

        <View style={styles.textWrap}>
          <Text numberOfLines={1} style={styles.title}>
            {name}
          </Text>
          <Text numberOfLines={1} style={styles.subtitle}>
            {time}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}
