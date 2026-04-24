import React, { useEffect, useCallback } from "react";
import {
	Dimensions,
	Image,
	Modal,
	Pressable,
	StyleSheet,
	Text,
	TextInput,
	View,
	Linking,
	ScrollView,
	Share,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import Animated, {
	useAnimatedStyle,
	useSharedValue,
	withSpring,
	withTiming,
	runOnJS,
} from "react-native-reanimated";
import {
	Gesture,
	GestureDetector,
	GestureHandlerRootView,
} from "react-native-gesture-handler";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../../hooks/useTheme";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

interface ShareUser {
	id: string;
	name: string;
	username: string;
	avatar: string;
}

interface ShareSheetProps {
	postId: string | null;
	visible: boolean;
	onClose: () => void;
	users?: ShareUser[];
}

export function ShareSheet({ postId, visible, onClose, users = [] }: ShareSheetProps) {
	const { colors, metrics, typography } = useTheme();
	const insets = useSafeAreaInsets();
	const translateY = useSharedValue(SCREEN_HEIGHT);
	const opacity = useSharedValue(0);

	const [searchQuery, setSearchQuery] = React.useState("");

	useEffect(() => {
		if (visible) {
			translateY.value = withSpring(0, { damping: 26, stiffness: 120 });
			opacity.value = withTiming(1, { duration: 250 });
		} else {
			translateY.value = withTiming(SCREEN_HEIGHT, { duration: 250 });
			opacity.value = withTiming(0, { duration: 200 });
			setTimeout(() => {
				setSearchQuery("");
			}, 300);
		}
	}, [visible, translateY, opacity]);

	const dismiss = useCallback(() => {
		translateY.value = withTiming(SCREEN_HEIGHT, { duration: 250 }, () => {
			runOnJS(onClose)();
		});
	}, [onClose, translateY]);

	const panGesture = Gesture.Pan()
		.onChange((event) => {
			if (event.translationY > 0) {
				translateY.value = event.translationY;
			}
		})
		.onEnd((event) => {
			if (event.translationY > SCREEN_HEIGHT * 0.25 || event.velocityY > 1000) {
				runOnJS(dismiss)();
			} else {
				translateY.value = withSpring(0, { damping: 26, stiffness: 120 });
			}
		});

	const animatedSheetStyle = useAnimatedStyle(() => ({
		transform: [{ translateY: translateY.value }],
	}));

	const animatedBackdropStyle = useAnimatedStyle(() => ({
		opacity: opacity.value,
	}));

	const getPostUrl = useCallback(() => {
		return `riderscompanion://post/${postId}`;
	}, [postId]);

	const handleOpenInApp = useCallback(() => {
		if (!postId) return;
		void Linking.openURL(getPostUrl());
		dismiss();
	}, [dismiss, getPostUrl, postId]);

	const handleCopyLink = useCallback(async () => {
		await Clipboard.setStringAsync(getPostUrl());
		dismiss();
	}, [getPostUrl, dismiss]);

	const handleNativeShare = useCallback(() => {
		void Share.share({
			message: `Open this Rider's Companion post: ${getPostUrl()}`,
			url: getPostUrl(),
		});
		dismiss();
	}, [dismiss, getPostUrl]);

	const handleShareWhatsApp = useCallback(() => {
		const url = `whatsapp://send?text=${encodeURIComponent(getPostUrl())}`;
		void Linking.openURL(url).catch(() => {
			// WhatsApp not installed
		});
		dismiss();
	}, [getPostUrl, dismiss]);

	const styles = React.useMemo(
		() =>
			StyleSheet.create({
				modalView: {
					flex: 1,
					justifyContent: "flex-end",
				},
				backdrop: {
					...StyleSheet.absoluteFillObject,
					backgroundColor: "rgba(0,0,0,0.5)",
				},
				sheet: {
					backgroundColor: colors.background,
					borderTopLeftRadius: metrics.radius.xl,
					borderTopRightRadius: metrics.radius.xl,
					overflow: "hidden",
					paddingBottom: insets.bottom + metrics.lg,
				},
				handleArea: {
					alignItems: "center",
					paddingVertical: metrics.sm,
				},
				handle: {
					width: 40,
					height: 5,
					borderRadius: 3,
					backgroundColor: colors.borderDark,
				},
				header: {
					flexDirection: "row",
					alignItems: "center",
					justifyContent: "space-between",
					paddingHorizontal: metrics.md,
					paddingBottom: metrics.sm,
				},
				title: {
					color: colors.textPrimary,
					fontSize: typography.sizes.lg,
					fontWeight: "700",
				},
				closeTap: {
					padding: metrics.xs,
				},
				searchWrap: {
					paddingHorizontal: metrics.md,
					marginBottom: metrics.md,
				},
				searchBox: {
					flexDirection: "row",
					alignItems: "center",
					backgroundColor: colors.surface,
					borderRadius: metrics.radius.full,
					paddingHorizontal: metrics.md,
					height: 44,
					gap: metrics.sm,
				},
				searchInput: {
					flex: 1,
					color: colors.textPrimary,
					fontSize: typography.sizes.base,
				},
				usersScroll: {
					paddingHorizontal: metrics.md,
					marginBottom: metrics.lg,
				},
				userItem: {
					alignItems: "center",
					marginRight: metrics.lg,
					width: 64,
				},
				userAvatarWrap: {
					width: 56,
					height: 56,
					borderRadius: 28,
					borderWidth: 2,
					borderColor: colors.border,
					overflow: "hidden",
					marginBottom: 4,
				},
				userAvatar: {
					width: "100%",
					height: "100%",
				},
				userName: {
					color: colors.textPrimary,
					fontSize: 13,
					fontWeight: "600",
					textAlign: "center",
				},
				userUsername: {
					color: colors.textTertiary,
					fontSize: 11,
					textAlign: "center",
				},
				divider: {
					height: 1,
					backgroundColor: colors.border,
					marginHorizontal: metrics.md,
					marginBottom: metrics.lg,
				},
				actionsGrid: {
					flexDirection: "row",
					flexWrap: "wrap",
					paddingHorizontal: metrics.md,
					gap: metrics.md,
				},
				actionItem: {
					width: (Dimensions.get("window").width - metrics.md * 2 - metrics.md * 3) / 4,
					alignItems: "center",
					marginBottom: metrics.md,
				},
				actionIconWrap: {
					width: 50,
					height: 50,
					borderRadius: 25,
					alignItems: "center",
					justifyContent: "center",
					marginBottom: 6,
				},
				actionLabel: {
					color: colors.textPrimary,
					fontSize: 11,
					textAlign: "center",
				},
			}),
		[colors, metrics, typography, insets.bottom],
	);

	const actions = [
		{
			id: "story",
			label: "Add post to your story",
			icon: <Ionicons name="add" size={24} color="#fff" />,
			color: "#E53E3E",
			onPress: handleNativeShare,
		},
		{
			id: "message",
			label: "Send as message",
			icon: <Ionicons name="chatbubble" size={24} color="#fff" />,
			color: "#3182CE",
			onPress: handleNativeShare,
		},
		{
			id: "open",
			label: "Open in app",
			icon: <Ionicons name="open-outline" size={24} color="#fff" />,
			color: "#2F855A",
			onPress: handleOpenInApp,
		},
		{
			id: "copy",
			label: "Copy link",
			icon: <Ionicons name="link" size={24} color="#fff" />,
			color: "#718096",
			onPress: handleCopyLink,
		},
		{
			id: "native",
			label: "Share",
			icon: <Ionicons name="share-social" size={24} color="#fff" />,
			color: "#3182CE",
			onPress: handleNativeShare,
		},
		{
			id: "whatsapp",
			label: "Share to WhatsApp",
			icon: <Ionicons name="logo-whatsapp" size={24} color="#fff" />,
			color: "#38A169",
			onPress: handleShareWhatsApp,
		},
	];

	return (
		<Modal visible={visible} transparent onRequestClose={dismiss} animationType="none">
			<GestureHandlerRootView style={styles.modalView}>
				<Animated.View style={[styles.backdrop, animatedBackdropStyle]}>
					<Pressable style={StyleSheet.absoluteFill} onPress={dismiss} />
				</Animated.View>

				<Animated.View style={[styles.sheet, animatedSheetStyle]}>
					<GestureDetector gesture={panGesture}>
						<View style={styles.handleArea}>
							<View style={styles.handle} />
						</View>
					</GestureDetector>

					<View style={styles.header}>
						<Text style={styles.title}>Share</Text>
						<Pressable onPress={dismiss} style={styles.closeTap}>
							<Ionicons name="close" size={24} color={colors.textPrimary} />
						</Pressable>
					</View>

					<View style={styles.searchWrap}>
						<View style={styles.searchBox}>
							<Ionicons name="search" size={20} color={colors.textTertiary} />
							<TextInput
								style={styles.searchInput}
								placeholder="Search"
								placeholderTextColor={colors.textTertiary}
								value={searchQuery}
								onChangeText={setSearchQuery}
							/>
						</View>
					</View>

					{users.length > 0 && (
						<View>
							<ScrollView
								horizontal
								showsHorizontalScrollIndicator={false}
								contentContainerStyle={styles.usersScroll}
							>
								{users.map((u) => (
									<Pressable key={u.id} onPress={handleNativeShare} style={styles.userItem}>
										<View style={styles.userAvatarWrap}>
											<Image source={{ uri: u.avatar }} style={styles.userAvatar} />
										</View>
										<Text style={styles.userName} numberOfLines={1}>
											{u.name}
										</Text>
										<Text style={styles.userUsername} numberOfLines={1}>
											@{u.username}
										</Text>
									</Pressable>
								))}
							</ScrollView>
							<View style={styles.divider} />
						</View>
					)}

					<View style={styles.actionsGrid}>
						{actions.map((action) => (
							<Pressable key={action.id} style={styles.actionItem} onPress={action.onPress}>
								<View style={[styles.actionIconWrap, { backgroundColor: action.color }]}>
									{action.icon}
								</View>
								<Text style={styles.actionLabel}>{action.label}</Text>
							</Pressable>
						))}
					</View>
				</Animated.View>
			</GestureHandlerRootView>
		</Modal>
	);
}
