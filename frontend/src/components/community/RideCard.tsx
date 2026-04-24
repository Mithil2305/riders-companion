import React from "react";
import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useTheme } from "../../hooks/useTheme";
import type { RideItem } from "../../types/community";
import { TagChip } from "./TagChip";

interface RideCardProps {
	item: RideItem;
	mode: "nearby" | "myRides";
	onPrimaryAction?: (id: string) => void;
}

function formatDateHumanReadable(dateStr: string): string {
	try {
		const d = new Date(dateStr);
		if (isNaN(d.getTime())) return dateStr;
		const options: Intl.DateTimeFormatOptions = {
			month: 'short',
			day: 'numeric',
			year: 'numeric',
			hour: '2-digit',
			minute: '2-digit',
		};
		return d.toLocaleDateString("en-US", options).replace(',', '').replace(' PM', ' PM').replace(' AM', ' AM');
	} catch (e) {
		return dateStr;
	}
}

export function RideCard({ item, mode, onPrimaryAction }: RideCardProps) {
	const { colors, metrics, typography } = useTheme();
	const isMyRide = mode === "myRides";
	const isCompleted = isMyRide && item.status === "completed";
	const isActionDisabled = isCompleted;

	// Parse route into source and destination if formatted as "A -> B"
	const routeParts = item.route.split("->").map(r => r.trim());
	const source = routeParts[0];
	const destination = routeParts.length > 1 ? routeParts[1] : null;
	const dateFormatted = item.startsAt.includes("T") ? formatDateHumanReadable(item.startsAt) : item.startsAt;

	const styles = React.useMemo(
		() =>
			StyleSheet.create({
				card: {
					borderRadius: 16,
					backgroundColor: colors.card,
					borderWidth: 1,
					borderColor: colors.border,
					padding: metrics.lg,
					shadowColor: colors.shadow,
					shadowOffset: { width: 0, height: 4 },
					shadowOpacity: 0.04,
					shadowRadius: 10,
					elevation: 2,
					opacity: isCompleted ? 0.75 : 1,
					position: 'relative',
				},
				topRow: {
					flexDirection: "row",
					justifyContent: "space-between",
					alignItems: "flex-start",
					marginBottom: metrics.lg,
				},
				routeContainer: {
					flex: 1,
					gap: 4,
				},
				routeNodeRow: {
					flexDirection: 'row',
					alignItems: 'center',
				},
				dotStart: {
					width: 8,
					height: 8,
					borderRadius: 4,
					backgroundColor: '#4CAF50',
					marginRight: metrics.sm,
				},
				dotEnd: {
					width: 8,
					height: 8,
					borderRadius: 4,
					backgroundColor: '#D32F2F',
					marginRight: metrics.sm,
				},
				dottedLine: {
					width: 2,
					height: 12,
					backgroundColor: colors.border,
					marginLeft: 3,
					marginVertical: 2,
				},
				routeText: {
					color: colors.textPrimary,
					fontSize: typography.sizes.lg,
					fontWeight: "700",
				},
				priceWrap: {
					alignItems: "flex-end",
				},
				price: {
					color: colors.primary,
					fontSize: typography.sizes["xl"],
					fontWeight: "700",
				},
				perDay: {
					color: colors.textTertiary,
					fontSize: typography.sizes.xs,
					fontWeight: "600",
					letterSpacing: 0.8,
				},
				dateRow: {
					flexDirection: 'row',
					alignItems: 'center',
					marginBottom: metrics.md,
				},
				dateIcon: {
					marginRight: 6,
				},
				dateText: {
					color: colors.textSecondary,
					fontSize: typography.sizes.sm,
					fontWeight: "600",
				},
				tagsRow: {
					flexDirection: "row",
					flexWrap: "wrap",
					gap: metrics.sm,
					marginBottom: metrics.lg,
				},
				bottomRow: {
					flexDirection: "row",
					alignItems: "center",
					justifyContent: "space-between",
				},
				joinedWrap: {
					flexDirection: "row",
					alignItems: "center",
				},
				joinedText: {
					marginLeft: metrics.sm,
					color: colors.textTertiary,
					fontSize: typography.sizes.xs,
					fontWeight: "600",
				},
				actionBtn: {
					height: 36,
					borderRadius: 18,
					borderWidth: 1,
					borderColor: isMyRide ? colors.borderDark : colors.primary,
					alignItems: "center",
					justifyContent: "center",
					backgroundColor: colors.background,
					paddingHorizontal: metrics.lg,
				},
				actionLabel: {
					color: isMyRide ? colors.textTertiary : colors.primary,
					fontSize: typography.sizes.sm,
					fontWeight: "700",
				},
				endedBadge: {
					position: 'absolute',
					top: metrics.md,
					right: metrics.md,
					borderRadius: metrics.radius.full,
					paddingHorizontal: metrics.sm,
					paddingVertical: 2,
					backgroundColor: colors.surface,
					borderWidth: 1,
					borderColor: colors.border,
				},
				statusEnded: {
					color: colors.textSecondary,
					fontSize: typography.sizes.xs - 2,
					fontWeight: "700",
					letterSpacing: 0.8,
				},
			}),
		[colors, isCompleted, isMyRide, metrics, typography],
	);

	const actionLabel = isMyRide
		? isCompleted
			? "Ended"
			: "Open Group"
		: "Join";

	return (
		<View style={styles.card}>
			{isCompleted && (
				<View style={styles.endedBadge}>
					<Text style={styles.statusEnded}>ENDED</Text>
				</View>
			)}

			<View style={styles.topRow}>
				<View style={styles.routeContainer}>
					<View style={styles.routeNodeRow}>
						<View style={styles.dotStart} />
						<Text style={styles.routeText}>{source}</Text>
					</View>
					{destination && (
						<>
							<View style={styles.dottedLine} />
							<View style={styles.routeNodeRow}>
								<View style={styles.dotEnd} />
								<Text style={styles.routeText}>{destination}</Text>
							</View>
						</>
					)}
				</View>

				{!isMyRide && (
					<View style={styles.priceWrap}>
						<Text style={styles.price}>{item.pricePerDay}</Text>
						<Text style={styles.perDay}>PER DAY</Text>
					</View>
				)}
			</View>

			<View style={styles.dateRow}>
				<Ionicons name="calendar-outline" size={16} color={colors.textSecondary} style={styles.dateIcon} />
				<Text style={styles.dateText}>{dateFormatted}</Text>
			</View>

			<View style={styles.tagsRow}>
				{item.tags.map((tag) => (
					<TagChip chip={tag} key={tag.id} />
				))}
			</View>

			<View style={styles.bottomRow}>
				<View style={styles.joinedWrap}>
					<Text style={styles.joinedText}>
						{isCompleted ? "0 joined • 0 invited" : item.joinedText}
					</Text>
				</View>

				<TouchableOpacity
					activeOpacity={isActionDisabled ? 1 : 0.8}
					disabled={isActionDisabled}
					onPress={() => onPrimaryAction?.(item.id)}
					style={styles.actionBtn}
				>
					<Text style={styles.actionLabel}>{actionLabel}</Text>
				</TouchableOpacity>
			</View>
		</View>
	);
}
