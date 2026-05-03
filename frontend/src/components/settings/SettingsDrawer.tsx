<<<<<<< HEAD
import React from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../hooks/useTheme';
import { usePlaybackSettings } from '../../hooks/usePlaybackSettings';
import { withAlpha } from '../../utils/color';

type DrawerItem = {
  id: 'profile' | 'notifications' | 'privacy' | 'help';
  title: string;
  subtitle: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
};

interface SettingsDrawerProps {
  onClose: () => void;
  onProfilePress: () => void;
  onNotificationsPress: () => void;
  onPrivacyPress?: () => void;
  onHelpPress?: () => void;
  onSignOutPress?: () => void;
  username?: string;
  avatarLetter?: string;
  version?: string;
  build?: string;
  dataSaverEnabled?: boolean;
  onToggleDataSaver?: () => void;
}

const accountItems: DrawerItem[] = [
  {
    id: 'profile',
    title: 'Profile',
    subtitle: 'Manage your account',
    icon: 'person-outline',
  },
  {
    id: 'notifications',
    title: 'Notifications',
    subtitle: 'Configure alerts',
    icon: 'notifications-outline',
  },
  {
    id: 'privacy',
    title: 'Privacy',
    subtitle: 'Security settings',
    icon: 'shield-outline',
  },
  {
    id: 'help',
    title: 'Help & Support',
    subtitle: 'Get assistance',
    icon: 'help-circle-outline',
  },
];

function DrawerHeader({
  username,
  avatarLetter,
  onClose,
}: {
  username: string;
  avatarLetter: string;
  onClose: () => void;
}) {
  const { colors, metrics, typography } = useTheme();
  const closePress = useSharedValue(0);
  const closeAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${closePress.value * 12}deg` }, { scale: 1 - closePress.value * 0.04 }],
    opacity: 1 - closePress.value * 0.1,
  }));

  const closeCircleBg = React.useMemo(
    () => withAlpha(colors.textInverse, 0.2),
    [colors.textInverse],
  );

  const avatarBg = React.useMemo(
    () => withAlpha(colors.textInverse, 0.28),
    [colors.textInverse],
  );

  const styles = React.useMemo(
    () =>
      StyleSheet.create({
        header: {
          minHeight: 132,
          backgroundColor: colors.primary,
          paddingHorizontal: metrics.md,
          paddingBottom: metrics.md,
          justifyContent: 'flex-end',
        },
        row: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: metrics.md,
        },
        avatarWrap: {
          width: 62,
          height: 62,
          borderRadius: 16,
          backgroundColor: avatarBg,
          alignItems: 'center',
          justifyContent: 'center',
          borderWidth: 1,
          borderColor: withAlpha(colors.textInverse, 0.35),
        },
        avatarText: {
          color: colors.textInverse,
          fontSize: typography.sizes['lg'],
          fontWeight: '700',
        },
        onlineDot: {
          position: 'absolute',
          width: 14,
          height: 14,
          borderRadius: 7,
          backgroundColor: colors.success,
          borderWidth: 2,
          borderColor: colors.textInverse,
          right: -2,
          bottom: -2,
        },
        userName: {
          flex: 1,
          color: colors.textInverse,
          fontSize: typography.sizes['lg'],
          fontWeight: '700',
        },
        closeButton: {
          width: 44,
          height: 44,
          borderRadius: 22,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: closeCircleBg,
        },
      }),
    [avatarBg, closeCircleBg, colors, metrics, typography],
  );

  return (
    <View style={styles.header}>
      <View style={styles.row}>
        <View style={styles.avatarWrap}>
          <Text style={styles.avatarText}>{avatarLetter}</Text>
          <View style={styles.onlineDot} />
        </View>
        <Text style={styles.userName}>{username}</Text>
        <Animated.View style={closeAnimatedStyle}>
          <Pressable
            onPress={onClose}
            onPressIn={() => {
              closePress.value = withTiming(1, { duration: 130 });
            }}
            onPressOut={() => {
              closePress.value = withTiming(0, { duration: 130 });
            }}
            style={styles.closeButton}
          >
            <Ionicons color={colors.textInverse} name="close" size={26} />
          </Pressable>
        </Animated.View>
      </View>
    </View>
  );
}

export function SettingsDrawer({
  onClose,
  onProfilePress,
  onNotificationsPress,
  onPrivacyPress,
  onHelpPress,
  onSignOutPress,
  username = 'Guest User',
  avatarLetter = 'G',
  version = 'Version 2.0.1',
  build = 'Build 2024.01',
  dataSaverEnabled,
  onToggleDataSaver,
}: SettingsDrawerProps) {
  const { colors, metrics, typography, resolvedMode, setMode } = useTheme();
  const playbackSettings = usePlaybackSettings();
  const { width } = useWindowDimensions();

  const drawerWidth = Math.min(width * 0.88, 420);
  const openProgress = useSharedValue(0);
  const signOutScale = useSharedValue(1);
  const switchProgress = useSharedValue(resolvedMode === 'dark' ? 1 : 0);

  React.useEffect(() => {
    openProgress.value = withTiming(1, {
      duration: 280,
      easing: Easing.out(Easing.cubic),
    });
  }, [openProgress]);

  React.useEffect(() => {
    switchProgress.value = withTiming(resolvedMode === 'dark' ? 1 : 0, { duration: 220 });
  }, [resolvedMode, switchProgress]);

  const animatedDrawerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: (1 - openProgress.value) * drawerWidth }],
  }));

  const animatedBackdropStyle = useAnimatedStyle(() => ({
    opacity: openProgress.value,
  }));

  const animatedSignOutStyle = useAnimatedStyle(() => ({
    transform: [{ scale: signOutScale.value }],
  }));

  const animatedSwitchThumbStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: switchProgress.value * 18 }],
  }));

  const closeDrawer = React.useCallback(() => {
    openProgress.value = withTiming(
      0,
      {
        duration: 240,
        easing: Easing.inOut(Easing.cubic),
      },
      (finished) => {
        if (finished) {
          runOnJS(onClose)();
        }
      },
    );
  }, [onClose, openProgress]);

  const isDarkModeEnabled = resolvedMode === 'dark';
  const isDataSaverEnabled =
    typeof dataSaverEnabled === 'boolean'
      ? dataSaverEnabled
      : playbackSettings.dataSaverEnabled;

  const toggleTheme = React.useCallback(() => {
    const nextMode = isDarkModeEnabled ? 'light' : 'dark';
    void setMode(nextMode);
  }, [isDarkModeEnabled, setMode]);

  const handleItemPress = React.useCallback(
    (itemId: DrawerItem['id']) => {
      if (itemId === 'profile') {
        onProfilePress();
        return;
      }

      if (itemId === 'notifications') {
        onNotificationsPress();
        return;
      }

      if (itemId === 'privacy') {
        onPrivacyPress?.();
        return;
      }

      onHelpPress?.();
    },
    [onHelpPress, onNotificationsPress, onPrivacyPress, onProfilePress],
  );

  const softSurface = React.useMemo(() => {
    const opacity = resolvedMode === 'dark' ? 0.18 : 0.045;
    return withAlpha(colors.textPrimary, opacity);
  }, [colors.textPrimary, resolvedMode]);

  const styles = React.useMemo(
    () =>
      StyleSheet.create({
        root: {
          flex: 1,
        },
        row: {
          flex: 1,
          flexDirection: 'row',
          justifyContent: 'flex-end',
        },
        backdrop: {
          flex: 1,
          backgroundColor: colors.overlay,
        },
        drawer: {
          height: '100%',
          backgroundColor: colors.background,
          shadowColor: colors.shadow,
          shadowOpacity: 0.22,
          shadowRadius: 12,
          shadowOffset: { width: -3, height: 0 },
          elevation: 9,
        },
        content: {
          paddingHorizontal: metrics.md,
          paddingTop: metrics.md,
          paddingBottom: metrics['lg'],
          gap: metrics.lg,
        },
        sectionWrap: {
          gap: metrics.sm,
        },
        sectionTitleRow: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: metrics.sm,
        },
        sectionTitle: {
          color: colors.textPrimary,
          fontSize: typography.sizes.lg,
          fontWeight: '700',
        },
        appearanceCard: {
          borderRadius: 16,
          borderWidth: 1,
          borderColor: colors.border,
          backgroundColor: softSurface,
          paddingHorizontal: metrics.sm,
          paddingVertical: metrics.sm,
        },
        appearanceRow: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: metrics.sm,
        },
        appearanceIconWrap: {
          width: 52,
          height: 52,
          borderRadius: 14,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colors.background,
          borderWidth: 1,
          borderColor: colors.border,
        },
        appearanceTextWrap: {
          flex: 1,
        },
        appearanceTitle: {
          color: colors.textPrimary,
          fontSize: typography.sizes.base,
          fontWeight: '700',
        },
        appearanceSubtitle: {
          marginTop: 2,
          color: colors.textSecondary,
          fontSize: typography.sizes.sm,
        },
        settingsStack: {
          gap: metrics.sm,
        },
        switchRoot: {
          width: 46,
          height: 28,
          borderRadius: 14,
          borderWidth: 1,
          borderColor:  colors.primary,
          backgroundColor: isDarkModeEnabled ? colors.primary : colors.background,
          justifyContent: 'center',
          paddingHorizontal: 2,
        },
        switchThumb: {
          width: 22,
          height: 22,
          borderRadius: 11,
          borderWidth: 1,
          borderColor: colors.border,
          backgroundColor: colors.textInverse,
        },
        accountList: {
          borderRadius: 16,
          borderWidth: 1,
          borderColor: colors.border,
          backgroundColor: colors.background,
          overflow: 'hidden',
        },
        item: {
          minHeight: 84,
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: metrics.sm,
          paddingVertical: metrics.sm,
          gap: metrics.sm,
        },
        itemPressed: {
          backgroundColor: softSurface,
        },
        itemIconWrap: {
          width: 52,
          height: 52,
          borderRadius: 14,
          borderWidth: 1,
          borderColor: colors.border,
          backgroundColor: softSurface,
          alignItems: 'center',
          justifyContent: 'center',
        },
        itemBody: {
          flex: 1,
        },
        itemTitle: {
          color: colors.textPrimary,
          fontSize: typography.sizes['base'],
          fontWeight: '700',
        },
        itemSubtitle: {
          marginTop: 2,
          color: colors.textSecondary,
          fontSize: typography.sizes['sm'],
        },
        divider: {
          height: 1,
          backgroundColor: colors.border,
          marginHorizontal: metrics.sm,
        },
        signOutWrap: {
          marginTop: metrics.md,
        },
        signOutButton: {
          minHeight: 48,
          borderRadius: 24,
          backgroundColor: colors.primary,
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'row',
          gap: metrics.sm,
        },
        signOutText: {
          color: colors.textInverse,
          fontSize: typography.sizes['lg'],
          fontWeight: '700',
        },
        footer: {
          marginTop: metrics.md,
          alignItems: 'center',
          gap: metrics.xs,
        },
        footerText: {
          color: colors.textSecondary,
          fontSize: typography.sizes.xs,
        },
      }),
    [
      colors,
      isDarkModeEnabled,
      metrics,
      softSurface,
      typography,
    ],
  );

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.root}>
      <View style={styles.row}>
        <Animated.View style={[styles.backdrop, animatedBackdropStyle]}>
          <Pressable onPress={closeDrawer} style={{ flex: 1 }} />
        </Animated.View>

        <Animated.View style={[styles.drawer, { width: drawerWidth }, animatedDrawerStyle]}>
          <DrawerHeader avatarLetter={avatarLetter} onClose={closeDrawer} username={username} />

          <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            <View style={styles.sectionWrap}>
              <View style={styles.sectionTitleRow}>
                <Ionicons color={colors.primary} name="color-palette-outline" size={metrics.icon.md} />
                <Text style={styles.sectionTitle}>Appearance</Text>
              </View>

              <View style={styles.appearanceCard}>
                <View style={styles.appearanceRow}>
                  <View style={styles.appearanceIconWrap}>
                    <Ionicons color={colors.primary} name="sunny-outline" size={metrics.icon.md} />
                  </View>
                  <View style={styles.appearanceTextWrap}>
                    <Text style={styles.appearanceTitle}>Dark Mode</Text>
                    <Text style={styles.appearanceSubtitle}>
                      {isDarkModeEnabled ? 'Dark theme is active' : 'Light theme is active'}
                    </Text>
                  </View>
                  <Pressable onPress={toggleTheme} style={styles.switchRoot}>
                    <Animated.View style={[styles.switchThumb, animatedSwitchThumbStyle]} />
                  </Pressable>
                </View>
              </View>

              <View style={styles.appearanceCard}>
                <View style={styles.appearanceRow}>
                  <View style={styles.appearanceIconWrap}>
                    <Ionicons color={colors.primary} name="cellular-outline" size={metrics.icon.md} />
                  </View>
                  <View style={styles.appearanceTextWrap}>
                    <Text style={styles.appearanceTitle}>Data Saver</Text>
                    <Text style={styles.appearanceSubtitle}>
                      {isDataSaverEnabled
                        ? 'Smaller buffer and lighter preloading for clips'
                        : 'Preload nearby clips for faster playback'}
                    </Text>
                  </View>
                  <Pressable
                    onPress={onToggleDataSaver ?? (() => void playbackSettings.toggleDataSaver())}
                    style={[
                      styles.switchRoot,
                      {
                        backgroundColor: isDataSaverEnabled
                          ? colors.primary
                          : colors.background,
                      },
                    ]}
                  >
                    <Animated.View
                      style={[
                        styles.switchThumb,
                        {
                          transform: [{ translateX: isDataSaverEnabled ? 18 : 0 }],
                        },
                      ]}
                    />
                  </Pressable>
                </View>
              </View>
            </View>

            <View style={styles.sectionWrap}>
              <Text style={styles.sectionTitle}>Account</Text>

              <View style={styles.accountList}>
                {accountItems.map((item, index) => (
                  <View key={item.id}>
                    <Pressable
                      onPress={() => handleItemPress(item.id)}
                      style={({ pressed }) => [styles.item, pressed && styles.itemPressed]}
                    >
                      <View style={styles.itemIconWrap}>
                        <Ionicons color={colors.primary} name={item.icon} size={metrics.icon.md} />
                      </View>

                      <View style={styles.itemBody}>
                        <Text style={styles.itemTitle}>{item.title}</Text>
                        <Text style={styles.itemSubtitle}>{item.subtitle}</Text>
                      </View>

                      <Ionicons color={colors.textSecondary} name="chevron-forward" size={metrics.icon.md} />
                    </Pressable>
                    {index < accountItems.length - 1 && <View style={styles.divider} />}
                  </View>
                ))}
              </View>
            </View>

            <Animated.View style={[styles.signOutWrap, animatedSignOutStyle]}>
              <Pressable
                onPress={onSignOutPress}
                onPressIn={() => {
                  signOutScale.value = withSpring(0.97, { damping: 14, stiffness: 260 });
                }}
                onPressOut={() => {
                  signOutScale.value = withSpring(1, { damping: 14, stiffness: 260 });
                }}
                style={styles.signOutButton}
              >
                <Ionicons color={colors.textInverse} name="log-out-outline" size={metrics.icon.md} />
                <Text style={styles.signOutText}>Sign Out</Text>
              </Pressable>
            </Animated.View>

            <View style={styles.footer}>
              <Text style={styles.footerText}>{version}</Text>
              <Text style={styles.footerText}>{build}</Text>
            </View>
          </ScrollView>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
=======
import React from "react";
import {
	Pressable,
	ScrollView,
	StyleSheet,
	Text,
	useWindowDimensions,
	View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
	Easing,
	runOnJS,
	useAnimatedStyle,
	useSharedValue,
	withSpring,
	withTiming,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../../hooks/useTheme";
import { withAlpha } from "../../utils/color";

type DrawerItem = {
	id: "profile" | "notifications" | "privacy" | "help";
	title: string;
	subtitle: string;
	icon: React.ComponentProps<typeof Ionicons>["name"];
};

interface SettingsDrawerProps {
	onClose: () => void;
	onProfilePress: () => void;
	onNotificationsPress: () => void;
	onAppearancePress?: () => void;
	onDataSaverPress?: () => void;
	onPrivacyPress?: () => void;
	onHelpPress?: () => void;
	onSignOutPress?: () => void;
	username?: string;
	avatarLetter?: string;
	version?: string;
	build?: string;
	dataSaverEnabled?: boolean;
}

const accountItems: DrawerItem[] = [
	{
		id: "profile",
		title: "Profile",
		subtitle: "Manage your account",
		icon: "person-outline",
	},
	{
		id: "notifications",
		title: "Notifications",
		subtitle: "Configure alerts",
		icon: "notifications-outline",
	},
	{
		id: "privacy",
		title: "Privacy",
		subtitle: "Security settings",
		icon: "shield-outline",
	},
	{
		id: "help",
		title: "Help & Support",
		subtitle: "Get assistance",
		icon: "help-circle-outline",
	},
];

function DrawerHeader({
	username,
	avatarLetter,
	onClose,
}: {
	username: string;
	avatarLetter: string;
	onClose: () => void;
}) {
	const { colors, metrics, typography } = useTheme();
	const closePress = useSharedValue(0);
	const closeAnimatedStyle = useAnimatedStyle(() => ({
		transform: [
			{ rotate: `${closePress.value * 12}deg` },
			{ scale: 1 - closePress.value * 0.04 },
		],
		opacity: 1 - closePress.value * 0.1,
	}));

	const closeCircleBg = React.useMemo(
		() => withAlpha(colors.textInverse, 0.2),
		[colors.textInverse],
	);

	const avatarBg = React.useMemo(
		() => withAlpha(colors.textInverse, 0.28),
		[colors.textInverse],
	);

	const styles = React.useMemo(
		() =>
			StyleSheet.create({
				header: {
					minHeight: 132,
					backgroundColor: colors.primary,
					paddingHorizontal: metrics.md,
					paddingBottom: metrics.md,
					justifyContent: "flex-end",
				},
				row: {
					flexDirection: "row",
					alignItems: "center",
					gap: metrics.md,
				},
				avatarWrap: {
					width: 62,
					height: 62,
					borderRadius: 16,
					backgroundColor: avatarBg,
					alignItems: "center",
					justifyContent: "center",
					borderWidth: 1,
					borderColor: withAlpha(colors.textInverse, 0.35),
				},
				avatarText: {
					color: colors.textInverse,
					fontSize: typography.sizes["lg"],
					fontWeight: "700",
				},
				onlineDot: {
					position: "absolute",
					width: 14,
					height: 14,
					borderRadius: 7,
					backgroundColor: colors.success,
					borderWidth: 2,
					borderColor: colors.textInverse,
					right: -2,
					bottom: -2,
				},
				userName: {
					flex: 1,
					color: colors.textInverse,
					fontSize: typography.sizes["lg"],
					fontWeight: "700",
				},
				closeButton: {
					width: 44,
					height: 44,
					borderRadius: 22,
					alignItems: "center",
					justifyContent: "center",
					backgroundColor: closeCircleBg,
				},
			}),
		[avatarBg, closeCircleBg, colors, metrics, typography],
	);

	return (
		<View style={styles.header}>
			<View style={styles.row}>
				<View style={styles.avatarWrap}>
					<Text style={styles.avatarText}>{avatarLetter}</Text>
					<View style={styles.onlineDot} />
				</View>
				<Text style={styles.userName}>{username}</Text>
				<Animated.View style={closeAnimatedStyle}>
					<Pressable
						onPress={onClose}
						onPressIn={() => {
							closePress.value = withTiming(1, { duration: 130 });
						}}
						onPressOut={() => {
							closePress.value = withTiming(0, { duration: 130 });
						}}
						style={styles.closeButton}
					>
						<Ionicons color={colors.textInverse} name="close" size={26} />
					</Pressable>
				</Animated.View>
			</View>
		</View>
	);
}

export function SettingsDrawer({
	onClose,
	onProfilePress,
	onNotificationsPress,
	onAppearancePress,
	onDataSaverPress,
	onPrivacyPress,
	onHelpPress,
	onSignOutPress,
	username = "Guest User",
	avatarLetter = "G",
	version = "Version 2.0.1",
	build = "Build 2024.01",
	dataSaverEnabled,
}: SettingsDrawerProps) {
	const { colors, metrics, typography, resolvedMode, setMode } = useTheme();
	const { width } = useWindowDimensions();

	const drawerWidth = Math.min(width * 0.88, 420);
	const openProgress = useSharedValue(0);
	const signOutScale = useSharedValue(1);

	React.useEffect(() => {
		openProgress.value = withTiming(1, {
			duration: 280,
			easing: Easing.out(Easing.cubic),
		});
	}, [openProgress]);

	const animatedDrawerStyle = useAnimatedStyle(() => ({
		transform: [{ translateX: (1 - openProgress.value) * drawerWidth }],
	}));

	const animatedBackdropStyle = useAnimatedStyle(() => ({
		opacity: openProgress.value,
	}));

	const animatedSignOutStyle = useAnimatedStyle(() => ({
		transform: [{ scale: signOutScale.value }],
	}));

	const closeDrawer = React.useCallback(() => {
		openProgress.value = withTiming(
			0,
			{
				duration: 240,
				easing: Easing.inOut(Easing.cubic),
			},
			(finished) => {
				if (finished) {
					runOnJS(onClose)();
				}
			},
		);
	}, [onClose, openProgress]);

	const isDarkModeEnabled = resolvedMode === "dark";
	const isDataSaverEnabled =
		typeof dataSaverEnabled === "boolean" ? dataSaverEnabled : false;

	const toggleTheme = React.useCallback(() => {
		const nextMode = isDarkModeEnabled ? "light" : "dark";
		void setMode(nextMode);
	}, [isDarkModeEnabled, setMode]);

	const handleItemPress = React.useCallback(
		(itemId: DrawerItem["id"]) => {
			if (itemId === "profile") {
				onProfilePress();
				return;
			}

			if (itemId === "notifications") {
				onNotificationsPress();
				return;
			}

			if (itemId === "privacy") {
				onPrivacyPress?.();
				return;
			}

			onHelpPress?.();
		},
		[onHelpPress, onNotificationsPress, onPrivacyPress, onProfilePress],
	);

	const softSurface = React.useMemo(() => {
		const opacity = resolvedMode === "dark" ? 0.18 : 0.045;
		return withAlpha(colors.textPrimary, opacity);
	}, [colors.textPrimary, resolvedMode]);

	const styles = React.useMemo(
		() =>
			StyleSheet.create({
				root: {
					flex: 1,
				},
				row: {
					flex: 1,
					flexDirection: "row",
					justifyContent: "flex-end",
				},
				backdrop: {
					flex: 1,
					backgroundColor: colors.overlay,
				},
				drawer: {
					height: "100%",
					backgroundColor: colors.background,
					shadowColor: colors.shadow,
					shadowOpacity: 0.22,
					shadowRadius: 12,
					shadowOffset: { width: -3, height: 0 },
					elevation: 9,
				},
				content: {
					paddingHorizontal: metrics.md,
					paddingTop: metrics.md,
					paddingBottom: metrics["lg"],
					gap: metrics.lg,
				},
				sectionWrap: {
					gap: metrics.sm,
				},
				sectionTitleRow: {
					flexDirection: "row",
					alignItems: "center",
					gap: metrics.sm,
				},
				sectionTitle: {
					color: colors.textPrimary,
					fontSize: typography.sizes.lg,
					fontWeight: "700",
				},
				settingsStack: {
					gap: metrics.sm,
				},
				accountList: {
					borderRadius: 16,
					borderWidth: 1,
					borderColor: colors.border,
					backgroundColor: colors.background,
					overflow: "hidden",
				},
				item: {
					minHeight: 84,
					flexDirection: "row",
					alignItems: "center",
					paddingHorizontal: metrics.sm,
					paddingVertical: metrics.sm,
					gap: metrics.sm,
				},
				itemPressed: {
					backgroundColor: softSurface,
				},
				itemIconWrap: {
					width: 52,
					height: 52,
					borderRadius: 14,
					borderWidth: 1,
					borderColor: colors.border,
					backgroundColor: softSurface,
					alignItems: "center",
					justifyContent: "center",
				},
				itemBody: {
					flex: 1,
				},
				itemTitle: {
					color: colors.textPrimary,
					fontSize: typography.sizes["base"],
					fontWeight: "700",
				},
				itemSubtitle: {
					marginTop: 2,
					color: colors.textSecondary,
					fontSize: typography.sizes["sm"],
				},
				divider: {
					height: 1,
					backgroundColor: colors.border,
					marginHorizontal: metrics.sm,
				},
				signOutWrap: {
					marginTop: metrics.md,
				},
				signOutButton: {
					minHeight: 48,
					borderRadius: 24,
					backgroundColor: colors.primary,
					alignItems: "center",
					justifyContent: "center",
					flexDirection: "row",
					gap: metrics.sm,
				},
				signOutText: {
					color: colors.textInverse,
					fontSize: typography.sizes["lg"],
					fontWeight: "700",
				},
				footer: {
					marginTop: metrics.md,
					alignItems: "center",
					gap: metrics.xs,
				},
				footerText: {
					color: colors.textSecondary,
					fontSize: typography.sizes.xs,
				},
			}),
		[colors, isDarkModeEnabled, metrics, softSurface, typography],
	);

	return (
		<SafeAreaView edges={["top", "bottom"]} style={styles.root}>
			<View style={styles.row}>
				<Animated.View style={[styles.backdrop, animatedBackdropStyle]}>
					<Pressable onPress={closeDrawer} style={{ flex: 1 }} />
				</Animated.View>

				<Animated.View
					style={[styles.drawer, { width: drawerWidth }, animatedDrawerStyle]}
				>
					<DrawerHeader
						avatarLetter={avatarLetter}
						onClose={closeDrawer}
						username={username}
					/>

					<ScrollView
						contentContainerStyle={styles.content}
						showsVerticalScrollIndicator={false}
					>
						<View style={styles.sectionWrap}>
							<Text style={styles.sectionTitle}>Preferences</Text>

							<View style={styles.accountList}>
								<View>
									<Pressable
										onPress={onAppearancePress ?? toggleTheme}
										style={({ pressed }) => [
											styles.item,
											pressed && styles.itemPressed,
										]}
									>
										<View style={styles.itemIconWrap}>
											<Ionicons
												color={colors.primary}
												name="sunny-outline"
												size={metrics.icon.md}
											/>
										</View>

										<View style={styles.itemBody}>
											<Text style={styles.itemTitle}>Appearance</Text>
											<Text style={styles.itemSubtitle}>
												{isDarkModeEnabled
													? "Dark mode enabled"
													: "Light mode enabled"}
											</Text>
										</View>

										<Ionicons
											color={colors.textSecondary}
											name="chevron-forward"
											size={metrics.icon.md}
										/>
									</Pressable>
									<View style={styles.divider} />
								</View>

								<View>
									<Pressable
										onPress={onDataSaverPress}
										style={({ pressed }) => [
											styles.item,
											pressed && styles.itemPressed,
										]}
									>
										<View style={styles.itemIconWrap}>
											<Ionicons
												color={colors.primary}
												name="cellular-outline"
												size={metrics.icon.md}
											/>
										</View>

										<View style={styles.itemBody}>
											<Text style={styles.itemTitle}>Data Saver</Text>
											<Text style={styles.itemSubtitle}>
												{isDataSaverEnabled
													? "Enabled for lighter clip playback"
													: "Preload nearby clips for faster playback"}
											</Text>
										</View>

										<Ionicons
											color={colors.textSecondary}
											name="chevron-forward"
											size={metrics.icon.md}
										/>
									</Pressable>
								</View>
							</View>
						</View>

						<View style={styles.sectionWrap}>
							<Text style={styles.sectionTitle}>Account</Text>

							<View style={styles.accountList}>
								{accountItems.map((item, index) => (
									<View key={item.id}>
										<Pressable
											onPress={() => handleItemPress(item.id)}
											style={({ pressed }) => [
												styles.item,
												pressed && styles.itemPressed,
											]}
										>
											<View style={styles.itemIconWrap}>
												<Ionicons
													color={colors.primary}
													name={item.icon}
													size={metrics.icon.md}
												/>
											</View>

											<View style={styles.itemBody}>
												<Text style={styles.itemTitle}>{item.title}</Text>
												<Text style={styles.itemSubtitle}>{item.subtitle}</Text>
											</View>

											<Ionicons
												color={colors.textSecondary}
												name="chevron-forward"
												size={metrics.icon.md}
											/>
										</Pressable>
										{index < accountItems.length - 1 && (
											<View style={styles.divider} />
										)}
									</View>
								))}
							</View>
						</View>

						<Animated.View style={[styles.signOutWrap, animatedSignOutStyle]}>
							<Pressable
								onPress={onSignOutPress}
								onPressIn={() => {
									signOutScale.value = withSpring(0.97, {
										damping: 14,
										stiffness: 260,
									});
								}}
								onPressOut={() => {
									signOutScale.value = withSpring(1, {
										damping: 14,
										stiffness: 260,
									});
								}}
								style={styles.signOutButton}
							>
								<Ionicons
									color={colors.textInverse}
									name="log-out-outline"
									size={metrics.icon.md}
								/>
								<Text style={styles.signOutText}>Sign Out</Text>
							</Pressable>
						</Animated.View>

						<View style={styles.footer}>
							<Text style={styles.footerText}>{version}</Text>
							<Text style={styles.footerText}>{build}</Text>
						</View>
					</ScrollView>
				</Animated.View>
			</View>
		</SafeAreaView>
	);
>>>>>>> cb3f167d96cf0daedb34e800dcf9590b155e87c0
}
