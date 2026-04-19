import React from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { useTheme } from "../../../hooks/useTheme";
import { withAlpha } from "../../../utils/color";

interface GroupChatMenuSheetProps {
	visible: boolean;
	isAdmin: boolean;
	isRideEnded?: boolean;
	onClose: () => void;
	onRideDetails: () => void;
	onInvite: () => void;
	onEndRide: () => void;
}

export function GroupChatMenuSheet({
	visible,
	isAdmin,
	isRideEnded = false,
	onClose,
	onRideDetails,
	onInvite,
	onEndRide,
}: GroupChatMenuSheetProps) {
	const { colors, metrics, typography } = useTheme();

	const styles = React.useMemo(
		() =>
			StyleSheet.create({
				overlay: {
					flex: 1,
					justifyContent: "flex-end",
					backgroundColor: withAlpha(colors.shadow, 0.3),
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
					shadowColor: colors.shadow,
					shadowOpacity: 0.18,
					shadowOffset: { width: 0, height: -4 },
					shadowRadius: 14,
					elevation: 10,
				},
				handle: {
					alignSelf: "center",
					width: 44,
					height: 4,
					borderRadius: metrics.radius.full,
					backgroundColor: colors.border,
					marginBottom: metrics.md,
				},
				rowTap: {
					paddingVertical: metrics.md - 2,
					borderBottomWidth: 1,
					borderBottomColor: colors.border,
				},
				rowText: {
					color: colors.textPrimary,
					fontSize: typography.sizes.base,
					fontWeight: "500",
				},
				inviteBtn: {
					marginTop: metrics.md,
					borderRadius: 20,
					alignItems: "center",
					justifyContent: "center",
					paddingVertical: metrics.sm + 2,
					backgroundColor: colors.primary,
					shadowColor: colors.shadow,
					shadowOpacity: 0.2,
					shadowOffset: { width: 0, height: 4 },
					shadowRadius: 10,
					elevation: 7,
				},
				inviteText: {
					color: colors.textInverse,
					fontSize: typography.sizes.base,
					fontWeight: "600",
				},
			}),
		[colors, metrics, typography],
	);

	const rows = isAdmin
		? isRideEnded
			? ["Ride Details", "Mute Notifications", "Report"]
			: ["Ride Details", "End Ride", "Mute Notifications", "Report"]
		: ["Ride Details", "Mute Notifications", "Report"];

	const onRowPress = (row: string) => {
		if (row === "End Ride") {
			onEndRide();
			return;
		}

		if (row === "Ride Details") {
			onRideDetails();
			return;
		}

		onClose();
	};

	return (
		<Modal
			animationType="fade"
			onRequestClose={onClose}
			transparent
			visible={visible}
		>
			<View style={styles.overlay}>
				<Pressable onPress={onClose} style={styles.backdrop} />
				<View style={styles.sheet}>
					<View style={styles.handle} />
					{rows.map((row) => (
						<Pressable
							key={row}
							onPress={() => onRowPress(row)}
							style={styles.rowTap}
						>
							<Text style={styles.rowText}>{row}</Text>
						</Pressable>
					))}
					{!isRideEnded ? (
						<Pressable
							accessibilityLabel="Invite friends"
							onPress={onInvite}
							style={styles.inviteBtn}
						>
							<Text style={styles.inviteText}>Invite Friends</Text>
						</Pressable>
					) : null}
				</View>
			</View>
		</Modal>
	);
}
