import React from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../../hooks/useTheme";
import { GroupChatItem } from "../../../types/groupChat";
import { GroupLocationCard } from "./GroupLocationCard";

interface GroupMessageBubbleProps {
	item: GroupChatItem;
}

export function GroupMessageBubble({ item }: GroupMessageBubbleProps) {
	const { colors, metrics, typography } = useTheme();

	const styles = React.useMemo(
		() =>
			StyleSheet.create({
				systemWrap: {
					alignItems: "center",
					marginBottom: metrics.lg,
				},
				systemPill: {
					borderRadius: metrics.radius.full,
					backgroundColor: colors.surface,
					borderWidth: 1,
					borderColor: colors.border,
					paddingVertical: metrics.xs + 4,
					paddingHorizontal: metrics.lg,
				},
				systemText: {
					color: colors.textTertiary,
					fontSize: typography.sizes.sm - 2,
					letterSpacing: 1.3,
					fontWeight: "500",
				},
				incomingRow: {
					flexDirection: "row",
					alignItems: "flex-end",
					marginBottom: metrics.md,
				},
				avatarWrap: {
					position: "relative",
					marginRight: metrics.sm,
				},
				avatar: {
					width: 38,
					height: 38,
					borderRadius: metrics.radius.md,
				},
				onlineBadge: {
					position: "absolute",
					bottom: 0,
					right: 0,
					width: 12,
					height: 12,
					borderRadius: 6,
					backgroundColor: colors.success || "#4CAF50",
					borderWidth: 2,
					borderColor: colors.card,
				},
				incomingContent: {
					maxWidth: "84%",
				},
				incomingBubble: {
					borderRadius: 18,
					backgroundColor: colors.card,
					borderWidth: 1,
					borderColor: colors.border,
					paddingHorizontal: metrics.md,
					paddingTop: metrics.sm + 2,
					paddingBottom: metrics.md,
					shadowColor: colors.shadow,
					shadowOpacity: 0.04,
					shadowOffset: { width: 0, height: 2 },
					shadowRadius: 6,
					elevation: 1,
				},
				senderName: {
					color: colors.primary,
					fontSize: typography.sizes.lg - 4,
					fontWeight: "600",
					letterSpacing: 0.8,
					textTransform: "uppercase",
					marginBottom: metrics.xs,
				},
				incomingText: {
					color: colors.textPrimary,
					fontSize: typography.sizes["base"],
					lineHeight: 24,
					fontWeight: "500",
				},
				time: {
					color: colors.textTertiary,
					fontSize: typography.sizes.xs,
					marginTop: metrics.sm,
				},
				outgoingWrap: {
					alignItems: "flex-end",
					marginBottom: metrics.md,
				},
				outgoingBubble: {
					maxWidth: "82%",
					borderRadius: 18,
					backgroundColor: colors.primary,
					paddingHorizontal: metrics.md,
					paddingVertical: metrics.md - 2,
					shadowColor: colors.shadow,
					shadowOpacity: 0.15,
					shadowOffset: { width: 0, height: 5 },
					shadowRadius: 12,
					elevation: 6,
				},
				outgoingText: {
					color: colors.textInverse,
					fontSize: typography.sizes["base"],
					lineHeight: 24,
					fontWeight: "500",
				},
				outgoingMeta: {
					marginTop: metrics.xs + 2,
					flexDirection: "row",
					alignItems: "center",
					gap: metrics.xs,
					marginRight: metrics.xs,
				},
			}),
		[colors, metrics, typography],
	);

	if (item.kind === "system") {
		return (
			<View style={styles.systemWrap}>
				<View style={styles.systemPill}>
					<Text style={styles.systemText}>{item.text}</Text>
				</View>
			</View>
		);
	}

	if (item.kind === "outgoing") {
		const statusIcon =
			item.status === "failed"
				? "alert-circle"
				: item.status === "sending"
					? "time"
					: "checkmark-done";
		const statusColor =
			item.status === "failed" ? colors.error : colors.primary;

		return (
			<View style={styles.outgoingWrap}>
				<View style={styles.outgoingBubble}>
					<Text style={styles.outgoingText}>{item.message}</Text>
				</View>
				<View style={styles.outgoingMeta}>
					<Text style={styles.time}>{item.time}</Text>
					<Ionicons color={statusColor} name={statusIcon} size={15} />
				</View>
			</View>
		);
	}

	return (
		<View style={styles.incomingRow}>
			<View style={styles.avatarWrap}>
				<Image source={{ uri: item.avatar }} style={styles.avatar} />
				{item.isOnline === true && <View style={styles.onlineBadge} />}
			</View>
			<View style={styles.incomingContent}>
				<View style={styles.incomingBubble}>
					<Text style={styles.senderName}>{item.senderName}</Text>
					<Text style={styles.incomingText}>{item.message}</Text>
				</View>

				{item.kind === "incoming-location" ? (
					<GroupLocationCard label={item.locationLabel} />
				) : null}

				<Text style={styles.time}>{item.time}</Text>
			</View>
		</View>
	);
}
