import React from "react";
import {
	Image,
	Pressable,
	StyleSheet,
	Text,
	View,
	type ImageStyle,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../hooks/useTheme";
import { ChatPreview } from "../../types/chat";

interface ChatItemProps {
	item: ChatPreview;
	onPress: () => void;
	onLongPress?: () => void;
}

const toPreviewText = (value: string, maxLength = 15) => {
	if (value.length <= maxLength) {
		return value;
	}

	return `${value.slice(0, maxLength)}...`;
};

export function ChatItem({ item, onPress, onLongPress }: ChatItemProps) {
	const { colors, metrics, typography } = useTheme();
	const isEnded = item.status === "ended";
	const isActive =
		item.roomType === "group"
			? Boolean(item.isOnline)
			: Boolean(item.isOnline || item.status === "active");
	const normalizedMessage = item.message.toLowerCase();
	const isTypingMessage = normalizedMessage.includes("typing");
	const previewMessage = toPreviewText(item.message, 15);

	const styles = React.useMemo(
		() =>
			StyleSheet.create({
				card: {
					marginHorizontal: metrics.sm,
					minHeight: 74,
					paddingHorizontal: metrics.md,
					paddingVertical: metrics.sm + 1,
					flexDirection: "row",
					alignItems: "flex-start",
					opacity: isEnded ? 0.55 : 1,
					backgroundColor: "transparent",
					borderBottomWidth: StyleSheet.hairlineWidth,
					borderBottomColor: colors.border,
				},
				avatarWrap: {
					width: 52,
					height: 52,
					borderRadius: metrics.radius.full,
					marginRight: metrics.sm + 2,
					position: "relative",
					backgroundColor: colors.chatSearchBg,
					overflow: "visible",
				},
				dot: {
					position: "absolute",
					right: -1,
					bottom: -1,
					zIndex: 10,
					width: 11,
					height: 11,
					borderRadius: metrics.radius.full,
					backgroundColor: colors.chatOnline,
					borderWidth: 2,
					borderColor: colors.chatListBackground,
				},
				center: {
					flex: 1,
					paddingRight: metrics.sm,
				},
				topRow: {
					flexDirection: "row",
					alignItems: "flex-start",
					justifyContent: "space-between",
				},
				name: {
					color: colors.textPrimary,
					fontSize: typography.sizes.base,
					fontWeight: "600",
					flexShrink: 1,
					marginTop: 1,
				},
				message: {
					color: colors.textSecondary,
					fontSize: typography.sizes.sm,
					fontWeight: "400",
					marginTop: 2,
				},
				senderInline: {
					color: colors.textSecondary,
					fontSize: typography.sizes.sm,
					fontWeight: "500",
				},
				messageInlineWrap: {
					flexDirection: "row",
					alignItems: "center",
					gap: 2,
					marginTop: 1,
				},
				endedMessageWrap: {
					flexDirection: "row",
					alignItems: "center",
					gap: metrics.xs,
					marginTop: 2,
				},
				endedMessage: {
					color: colors.textTertiary,
					fontSize: typography.sizes.sm,
					fontStyle: "italic",
					fontWeight: "400",
				},
				time: {
					color: colors.textTertiary,
					fontSize: typography.sizes.xs,
					fontWeight: "400",
					textAlign: "right",
				},
				typingText: {
					color: colors.chatOnline,
					fontSize: typography.sizes.sm,
					fontWeight: "500",
				},
			}),
		[colors, isEnded, metrics, typography],
	);

	const avatarStyle = React.useMemo<ImageStyle>(
		() => ({
			width: 52,
			height: 52,
			borderRadius: metrics.radius.full,
		}),
		[metrics.radius.full],
	);

	return (
		<Pressable
			android_ripple={{ color: colors.overlayLight }}
			delayLongPress={240}
			onLongPress={onLongPress}
			onPress={onPress}
			style={styles.card}
		>
			<View style={styles.avatarWrap}>
				<Image source={{ uri: item.avatar }} style={avatarStyle} />
				{isActive ? <View style={styles.dot} /> : null}
			</View>

			<View style={styles.center}>
				<View style={styles.topRow}>
					<Text numberOfLines={1} style={styles.name}>
						{item.name}
					</Text>
					<Text style={styles.time}>{item.time}</Text>
				</View>

				{item.senderName ? (
					<View style={styles.messageInlineWrap}>
						<Text numberOfLines={1} style={styles.senderInline}>
							{item.senderName}:
						</Text>
						<Text
							numberOfLines={1}
							style={isTypingMessage ? styles.typingText : styles.message}
						>
							{previewMessage}
						</Text>
					</View>
				) : isEnded ? (
					<View style={styles.endedMessageWrap}>
						<Ionicons
							color={colors.textTertiary}
							name="checkmark-done-outline"
							size={metrics.icon.md}
						/>
						<Text numberOfLines={1} style={styles.endedMessage}>
							{previewMessage}
						</Text>
					</View>
				) : (
					<Text numberOfLines={1} style={styles.message}>
						{previewMessage}
					</Text>
				)}
			</View>
		</Pressable>
	);
}
