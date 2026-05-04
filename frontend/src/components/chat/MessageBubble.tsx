import React from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
	FadeInLeft,
	FadeInRight,
	ZoomIn,
} from "react-native-reanimated";
import { useTheme } from "../../hooks/useTheme";
import { PersonalChatMessage } from "../../types/chat";
import { toRideInvitePreview } from "../../utils/rideInviteMessage";
import {
	parseSharedContentMessage,
	toSharedContentPreview,
} from "../../utils/sharedContentMessage";
import { useRouter } from "expo-router";
import { withAlpha } from "../../utils/color";

interface MessageBubbleProps {
	message: PersonalChatMessage;
	onInviteAction?: (messageId: string, action: "join" | "reject") => void;
}

export function MessageBubble({ message, onInviteAction }: MessageBubbleProps) {
	const { colors, metrics, typography } = useTheme();
	const router = useRouter();
	const isOutgoing = message.sender === "me";

	const inviteRouteLine =
		message.kind === "invite"
			? [message.invite.source?.trim(), message.invite.destination?.trim()]
					.filter((value): value is string => Boolean(value))
					.join(" → ") ||
				message.invite.rideTitle?.trim() ||
				message.invite.roomName
			: null;

	const inviteStatusLabel =
		message.kind === "invite"
			? message.invite.status === "pending"
				? isOutgoing
					? "Awaiting reply"
					: "Pending"
				: message.invite.status === "joined"
					? "Accepted"
					: "Declined"
			: null;

	const inviteStatusTone =
		message.kind === "invite"
			? message.invite.status === "joined"
				? {
						backgroundColor: withAlpha(colors.success, 0.12),
						textColor: colors.success,
					}
				: message.invite.status === "rejected"
					? {
							backgroundColor: withAlpha(colors.error, 0.12),
							textColor: colors.error,
						}
					: {
							backgroundColor: withAlpha(colors.primary, 0.12),
							textColor: colors.primary,
						}
			: null;

	const inviteMetaItems =
		message.kind === "invite"
			? [
					message.invite.startDate
						? {
								label: "Start",
								value: new Date(message.invite.startDate).toLocaleDateString(
									[],
									{
										month: "short",
										day: "2-digit",
									},
								),
							}
						: null,
					message.invite.days != null
						? {
								label: "Days",
								value: String(message.invite.days),
							}
						: null,
					message.invite.budget != null
						? {
								label: "Budget",
								value: `₹${message.invite.budget.toLocaleString()}`,
							}
						: null,
					message.invite.ridePace
						? {
								label: "Pace",
								value: `${message.invite.ridePace.charAt(0).toUpperCase()}${message.invite.ridePace.slice(1)}`,
							}
						: null,
				]
					.filter((item): item is { label: string; value: string } =>
						Boolean(item),
					)
					.slice(0, 3)
			: [];

	const inviteNotes =
		message.kind === "invite" && typeof message.invite.meetupNotes === "string"
			? message.invite.meetupNotes.trim()
			: "";

	const styles = React.useMemo(
		() =>
			StyleSheet.create({
				row: {
					marginBottom: metrics.sm,
				},
				rowOutgoing: {
					alignItems: "flex-end",
					justifyContent: "flex-end",
				},
				rowIncoming: {
					alignItems: "flex-start",
					justifyContent: "flex-start",
				},
				bubbleWrap: {
					maxWidth: "84%",
					position: "relative",
				},
				bubble: {
					paddingHorizontal: metrics.md,
					paddingVertical: metrics.md,
				},
				bubbleIncoming: {
					borderRadius: 22,
					backgroundColor: colors.chatIncomingBubbleBg,
					shadowColor: colors.shadow,
					shadowOpacity: 0.05,
					shadowRadius: 8,
					shadowOffset: { width: 0, height: 2 },
					elevation: 1,
				},
				bubbleOutgoing: {
					backgroundColor: colors.chatOutgoingBubbleBg,
					borderRadius:
						message.kind === "image" ? 0 : message.kind === "invite" ? 18 : 22,
					borderBottomLeftRadius: 22,
					borderBottomRightRadius: 22,
				},
				textIncoming: {
					color: colors.textPrimary,
					fontSize: typography.sizes.base,
					fontWeight: "400",
					lineHeight: 24,
				},
				textOutgoing: {
					color: colors.textInverse,
					fontSize: typography.sizes.base,
					fontWeight: "400",
					lineHeight: 24,
				},
				image: {
					width: "100%",
					aspectRatio: 1.75,
				},
				imageWrap: {
					overflow: "hidden",
					borderTopLeftRadius: 22,
					borderTopRightRadius: 22,
				},
				metaRow: {
					marginTop: metrics.xs,
					flexDirection: "row",
					alignItems: "center",
					justifyContent: "flex-end",
					gap: metrics.xs,
				},
				metaIncoming: {
					justifyContent: "flex-start",
				},
				timeText: {
					color: colors.textTertiary,
					fontSize: typography.sizes.xs,
					fontWeight: "500",
				},
				reaction: {
					position: "absolute",
					right: -11,
					bottom: -9,
					fontSize: typography.sizes.lg,
				},
				inviteWrap: {
					borderRadius: 16,
					borderWidth: 1,
					borderColor: isOutgoing
						? withAlpha(colors.chatOutgoingBubbleBg, 0.6)
						: colors.border,
					backgroundColor: isOutgoing
						? colors.chatOutgoingBubbleBg
						: colors.surface,
					padding: metrics.md,
					gap: metrics.sm,
				},
				inviteHeaderRow: {
					flexDirection: "row",
					alignItems: "flex-start",
					justifyContent: "space-between",
					gap: metrics.sm,
				},
				inviteHeaderCopy: {
					gap: 4,
				},
				inviteBadge: {
					alignSelf: "flex-start",
					borderRadius: metrics.radius.full,
					paddingHorizontal: metrics.sm,
					paddingVertical: 3,
					backgroundColor: isOutgoing
						? withAlpha(colors.textInverse, 0.18)
						: colors.chatDateBadgeBg,
				},
				inviteStatusBadge: {
					borderRadius: metrics.radius.full,
					position: "absolute",
					top: 0,
					right: 0,
					paddingHorizontal: metrics.sm,
					paddingVertical: 4,
				},
				inviteBadgeText: {
					color: isOutgoing ? colors.textInverse : colors.chatDateBadgeText,
					fontSize: typography.sizes.xs,
					fontWeight: "700",
					letterSpacing: 0.4,
				},
				inviteStatusText: {
					fontSize: typography.sizes.xs,
					fontWeight: "700",
					letterSpacing: 0.4,
					textTransform: "uppercase",
				},
				inviteTitle: {
					color: isOutgoing ? colors.textInverse : colors.textPrimary,
					fontSize: typography.sizes.base,
					fontWeight: "700",
				},
				inviteSubtitle: {
					color: isOutgoing
						? withAlpha(colors.textInverse, 0.72)
						: colors.textSecondary,
					fontSize: typography.sizes.sm,
					fontWeight: "500",
				},
				inviteRouteRow: {
					flexDirection: "row",
					alignItems: "flex-start",
					gap: metrics.xs,
				},
				inviteRouteIcon: {
					marginTop: 1,
				},
				inviteRouteText: {
					flex: 1,
					color: isOutgoing ? colors.textInverse : colors.textPrimary,
					fontSize: typography.sizes.sm,
					fontWeight: "600",
					lineHeight: 20,
				},
				inviteMetaRow: {
					flexDirection: "row",
					flexWrap: "wrap",
					gap: metrics.xs,
				},
				inviteMetaPill: {
					flexGrow: 1,
					minWidth: 96,
					borderRadius: 12,
					paddingHorizontal: metrics.sm,
					paddingVertical: metrics.xs,
					backgroundColor: isOutgoing
						? withAlpha(colors.textInverse, 0.16)
						: colors.chatDateBadgeBg,
					flexDirection: "row",
					alignItems: "center",
					justifyContent: "space-between",
					gap: metrics.xs,
				},
				inviteMetaLabel: {
					color: isOutgoing
						? withAlpha(colors.textInverse, 0.7)
						: colors.textSecondary,
					fontSize: typography.sizes.xs,
					fontWeight: "600",
					textTransform: "uppercase",
				},
				inviteMetaValue: {
					color: isOutgoing ? colors.textInverse : colors.textPrimary,
					fontSize: typography.sizes.xs,
					fontWeight: "700",
				},
				inviteNotesWrap: {
					borderRadius: 12,
					paddingHorizontal: metrics.sm,
					paddingVertical: metrics.sm,
					backgroundColor: isOutgoing
						? withAlpha(colors.textInverse, 0.14)
						: colors.chatDateBadgeBg,
					gap: 4,
				},
				inviteNotesLabel: {
					color: isOutgoing
						? withAlpha(colors.textInverse, 0.7)
						: colors.textSecondary,
					fontSize: typography.sizes.xs,
					fontWeight: "700",
					letterSpacing: 0.3,
					textTransform: "uppercase",
				},
				inviteNotesText: {
					color: isOutgoing ? colors.textInverse : colors.textPrimary,
					fontSize: typography.sizes.sm,
					fontWeight: "500",
					lineHeight: 18,
				},
				inviteActionRow: {
					marginTop: metrics.xs,
					flexDirection: "row",
					gap: metrics.xs,
				},
				inviteActionBtn: {
					flex: 1,
					minHeight: 36,
					borderRadius: 18,
					alignItems: "center",
					justifyContent: "center",
					paddingHorizontal: metrics.sm,
				},
				inviteJoinBtn: {
					backgroundColor: colors.primary,
				},
				inviteRejectBtn: {
					backgroundColor: isOutgoing
						? withAlpha(colors.textInverse, 0.18)
						: colors.surface,
					borderWidth: 1,
					borderColor: isOutgoing
						? withAlpha(colors.textInverse, 0.35)
						: colors.border,
				},
				inviteActionText: {
					color: colors.textInverse,
					fontSize: typography.sizes.sm,
					fontWeight: "700",
				},
				inviteRejectText: {
					color: isOutgoing ? colors.textInverse : colors.textPrimary,
				},
				sharedWrap: {
					borderRadius: 16,
					borderWidth: 1,
					borderColor: isOutgoing ? colors.overlayLight : colors.border,
					backgroundColor: isOutgoing
						? colors.chatOutgoingBubbleBg
						: colors.surface,
					overflow: "hidden",
					width: 220,
				},
				sharedThumb: {
					width: "100%",
					height: 120,
					backgroundColor: colors.surface,
				},
				sharedMeta: {
					padding: metrics.sm,
					gap: 2,
				},
				sharedBadge: {
					alignSelf: "flex-start",
					borderRadius: metrics.radius.full,
					paddingHorizontal: metrics.sm,
					paddingVertical: 2,
					backgroundColor: isOutgoing ? colors.overlay : colors.chatDateBadgeBg,
				},
				sharedBadgeText: {
					color: isOutgoing ? colors.textInverse : colors.chatDateBadgeText,
					fontSize: typography.sizes.xs,
					fontWeight: "700",
					letterSpacing: 0.4,
				},
				sharedTitle: {
					color: isOutgoing ? colors.textInverse : colors.textPrimary,
					fontSize: typography.sizes.sm,
					fontWeight: "700",
				},
				sharedCaption: {
					color: isOutgoing ? colors.textInverse : colors.textSecondary,
					fontSize: typography.sizes.sm,
					fontWeight: "500",
				},
			}),
		[colors, message.kind, metrics, typography],
	);

	const tickIcon =
		message.delivery === "read"
			? "checkmark-done"
			: message.delivery === "delivered"
				? "checkmark-done-outline"
				: "checkmark";

	const hasText =
		message.kind === "text" ||
		(message.kind === "image" &&
			typeof message.text === "string" &&
			message.text.trim().length > 0);

	const inviteLabel =
		message.kind === "invite"
			? toRideInvitePreview(message.invite, isOutgoing ? "sender" : "receiver")
			: null;

	const sharedPayload =
		message.kind === "shared-content" ? message.shared : null;

	return (
		<Animated.View
			entering={
				isOutgoing ? FadeInRight.duration(260) : FadeInLeft.duration(260)
			}
			style={[styles.row, isOutgoing ? styles.rowOutgoing : styles.rowIncoming]}
		>
			<View style={styles.bubbleWrap}>
				{message.kind === "image" ? (
					<View style={styles.imageWrap}>
						<Image source={{ uri: message.imageUrl }} style={styles.image} />
					</View>
				) : null}
				{message.kind === "invite" ? (
					<View
						style={[
							styles.bubble,
							isOutgoing ? styles.bubbleOutgoing : styles.bubbleIncoming,
						]}
					>
						<View style={styles.inviteWrap}>
							<View style={styles.inviteHeaderRow}>
								<View style={styles.inviteHeaderCopy}>
									<View style={styles.inviteBadge}>
										<Text style={styles.inviteBadgeText}>RIDE INVITE</Text>
									</View>
									<Text numberOfLines={1} style={styles.inviteTitle}>
										{message.invite.roomName}
									</Text>
									<Text style={styles.inviteSubtitle}>{inviteLabel}</Text>
								</View>
								{inviteStatusLabel && inviteStatusTone ? (
									<View
										style={[
											styles.inviteStatusBadge,
											{ backgroundColor: inviteStatusTone.backgroundColor },
										]}
									>
										<Text
											style={[
												styles.inviteStatusText,
												{ color: inviteStatusTone.textColor },
											]}
										>
											{inviteStatusLabel}
										</Text>
									</View>
								) : null}
							</View>

							<View style={styles.inviteRouteRow}>
								<Ionicons
									color={isOutgoing ? colors.textInverse : colors.primary}
									name="navigate-outline"
									size={16}
									style={styles.inviteRouteIcon}
								/>
								<Text numberOfLines={2} style={styles.inviteRouteText}>
									{inviteRouteLine}
								</Text>
							</View>

							{inviteMetaItems.length > 0 ? (
								<View style={styles.inviteMetaRow}>
									{inviteMetaItems.map((item) => (
										<View
											key={`${message.id}-${item.label}`}
											style={styles.inviteMetaPill}
										>
											<Text style={styles.inviteMetaLabel}>{item.label}</Text>
											<Text numberOfLines={1} style={styles.inviteMetaValue}>
												{item.value}
											</Text>
										</View>
									))}
								</View>
							) : null}

							{inviteNotes ? (
								<View style={styles.inviteNotesWrap}>
									<Text style={styles.inviteNotesLabel}>Meeting notes</Text>
									<Text style={styles.inviteNotesText}>{inviteNotes}</Text>
								</View>
							) : null}

							{message.sender === "other" &&
							message.invite.status === "pending" ? (
								<View style={styles.inviteActionRow}>
									<Pressable
										onPress={() => onInviteAction?.(message.id, "join")}
										style={[styles.inviteActionBtn, styles.inviteJoinBtn]}
									>
										<Text style={styles.inviteActionText}>Accept</Text>
									</Pressable>
									<Pressable
										onPress={() => onInviteAction?.(message.id, "reject")}
										style={[styles.inviteActionBtn, styles.inviteRejectBtn]}
									>
										<Text
											style={[styles.inviteActionText, styles.inviteRejectText]}
										>
											Reject
										</Text>
									</Pressable>
								</View>
							) : null}
						</View>
					</View>
				) : sharedPayload ? (
					<Pressable
						onPress={() => {
							if (sharedPayload.resourceType === "clip") {
								router.push({
									pathname: "/(tabs)/clips",
									params: { clipId: sharedPayload.resourceId },
								});
							} else {
								router.push(`/post/${sharedPayload.resourceId}`);
							}
						}}
						style={[
							styles.bubble,
							isOutgoing ? styles.bubbleOutgoing : styles.bubbleIncoming,
						]}
					>
						<View style={styles.sharedWrap}>
							{sharedPayload.thumbnailUrl ? (
								<Image
									resizeMode="cover"
									source={{ uri: sharedPayload.thumbnailUrl }}
									style={styles.sharedThumb}
								/>
							) : null}
							<View style={styles.sharedMeta}>
								<View style={styles.sharedBadge}>
									<Text style={styles.sharedBadgeText}>
										{sharedPayload.resourceType === "clip" ? "CLIP" : "POST"}
									</Text>
								</View>
								{sharedPayload.title ? (
									<Text numberOfLines={1} style={styles.sharedTitle}>
										{sharedPayload.title}
									</Text>
								) : null}
								{sharedPayload.caption ? (
									<Text numberOfLines={2} style={styles.sharedCaption}>
										{sharedPayload.caption}
									</Text>
								) : null}
							</View>
						</View>
					</Pressable>
				) : hasText ? (
					<View
						style={[
							styles.bubble,
							isOutgoing ? styles.bubbleOutgoing : styles.bubbleIncoming,
						]}
					>
						<Text
							style={isOutgoing ? styles.textOutgoing : styles.textIncoming}
						>
							{message.text}
						</Text>
					</View>
				) : null}

				<View style={[styles.metaRow, isOutgoing ? null : styles.metaIncoming]}>
					<Text style={styles.timeText}>{message.timeLabel}</Text>
					{isOutgoing ? (
						<Ionicons
							color={colors.chatMetaRed}
							name={tickIcon}
							size={metrics.icon.sm - 2}
						/>
					) : null}
				</View>

				{message.reaction ? (
					<Animated.Text
						entering={ZoomIn.springify().damping(11)}
						style={styles.reaction}
					>
						{message.reaction}
					</Animated.Text>
				) : null}
			</View>
		</Animated.View>
	);
}

export const MemoMessageBubble = React.memo(MessageBubble);
