import React from "react";
import {
	Image,
	Modal,
	Pressable,
	ScrollView,
	StyleSheet,
	Text,
	View,
} from "react-native";
import { useTheme } from "../../../hooks/useTheme";
import { withAlpha } from "../../../utils/color";
import { GroupRideMember } from "../../../types/groupChat";

interface GroupRideDetailsModalProps {
	visible: boolean;
	groupName: string;
	organizer: GroupRideMember | null;
	riders: GroupRideMember[];
	onClose: () => void;
	onToggleTrack: (riderId: string) => void;
	onOpenProfile: (riderId: string) => void;
}

const avatarFor = (member: GroupRideMember) => {
	if (member.avatar && member.avatar.trim().length > 0) {
		return member.avatar;
	}

	return `https://ui-avatars.com/api/?name=${encodeURIComponent(
		member.name,
	)}&background=0D8ABC&color=fff`;
};

export function GroupRideDetailsModal({
	visible,
	groupName,
	organizer,
	riders,
	onClose,
	onToggleTrack,
	onOpenProfile,
}: GroupRideDetailsModalProps) {
	const { colors, metrics, typography } = useTheme();

	const styles = React.useMemo(
		() =>
			StyleSheet.create({
				overlay: {
					flex: 1,
					justifyContent: "flex-end",
					backgroundColor: withAlpha(colors.shadow, 0.35),
				},
				backdrop: {
					flex: 1,
				},
				sheet: {
					backgroundColor: colors.surface,
					borderTopLeftRadius: 22,
					borderTopRightRadius: 22,
					paddingHorizontal: metrics.md,
					paddingTop: metrics.md,
					paddingBottom: metrics.lg,
					maxHeight: "78%",
				},
				handle: {
					alignSelf: "center",
					width: 44,
					height: 4,
					borderRadius: metrics.radius.full,
					backgroundColor: colors.border,
					marginBottom: metrics.md,
				},
				title: {
					color: colors.textPrimary,
					fontSize: typography.sizes.lg,
					fontWeight: "700",
				},
				subtitle: {
					marginTop: 2,
					color: colors.textSecondary,
					fontSize: typography.sizes.sm,
					fontWeight: "500",
				},
				sectionTitle: {
					marginTop: metrics.md,
					marginBottom: metrics.sm,
					color: colors.textTertiary,
					fontSize: typography.sizes.xs,
					fontWeight: "700",
					letterSpacing: 0.5,
				},
				row: {
					flexDirection: "row",
					alignItems: "center",
					justifyContent: "space-between",
					paddingVertical: metrics.sm,
					borderBottomWidth: StyleSheet.hairlineWidth,
					borderBottomColor: colors.border,
				},
				left: {
					flexDirection: "row",
					alignItems: "center",
					gap: metrics.sm,
					flex: 1,
				},
				avatar: {
					width: 42,
					height: 42,
					borderRadius: metrics.radius.full,
				},
				name: {
					color: colors.textPrimary,
					fontSize: typography.sizes.base,
					fontWeight: "600",
				},
				meta: {
					color: colors.textSecondary,
					fontSize: typography.sizes.sm,
					fontWeight: "500",
				},
				followBtn: {
					minWidth: 86,
					paddingHorizontal: metrics.md,
					paddingVertical: metrics.xs + 2,
					borderRadius: metrics.radius.full,
					backgroundColor: colors.primary,
					alignItems: "center",
					justifyContent: "center",
				},
				followingBtn: {
					backgroundColor: colors.surface,
					borderWidth: 1,
					borderColor: colors.border,
				},
				followText: {
					color: colors.textInverse,
					fontSize: typography.sizes.sm,
					fontWeight: "700",
				},
				followingText: {
					color: colors.textSecondary,
				},
			}),
		[colors, metrics, typography],
	);

	const renderMember = (member: GroupRideMember, isOrganizerRow = false) => (
		<View
			key={`${isOrganizerRow ? "org" : "member"}-${member.id}`}
			style={styles.row}
		>
			<Pressable onPress={() => onOpenProfile(member.id)} style={styles.left}>
				<Image source={{ uri: avatarFor(member) }} style={styles.avatar} />
				<View style={{ flex: 1 }}>
					<Text numberOfLines={1} style={styles.name}>
						{member.name}
					</Text>
					<Text numberOfLines={1} style={styles.meta}>
						{isOrganizerRow
							? "Organizer"
							: member.username
								? `@${member.username}`
								: member.status || "Rider"}
					</Text>
				</View>
			</Pressable>

			{isOrganizerRow ? null : (
				<Pressable
					onPress={() => onToggleTrack(member.id)}
					style={[
						styles.followBtn,
						member.isFollowing ? styles.followingBtn : null,
					]}
				>
					<Text
						style={[
							styles.followText,
							member.isFollowing ? styles.followingText : null,
						]}
					>
						{member.isFollowing ? "Untrack" : "Track"}
					</Text>
				</Pressable>
			)}
		</View>
	);

	return (
		<Modal
			animationType="slide"
			onRequestClose={onClose}
			transparent
			visible={visible}
		>
			<View style={styles.overlay}>
				<Pressable onPress={onClose} style={styles.backdrop} />
				<View style={styles.sheet}>
					<View style={styles.handle} />
					<Text numberOfLines={1} style={styles.title}>
						Ride Details
					</Text>
					<Text numberOfLines={1} style={styles.subtitle}>
						{groupName}
					</Text>

					<ScrollView showsVerticalScrollIndicator={false}>
						{organizer ? (
							<>
								<Text style={styles.sectionTitle}>ORGANIZER</Text>
								{renderMember(organizer, true)}
							</>
						) : null}

						<Text style={styles.sectionTitle}>RIDERS</Text>
						{riders.map((member) => renderMember(member, false))}
					</ScrollView>
				</View>
			</View>
		</Modal>
	);
}
