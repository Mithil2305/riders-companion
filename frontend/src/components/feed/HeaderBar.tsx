import React from "react";
import {
	ActivityIndicator,
	Image,
	Pressable,
	StyleSheet,
	Text,
	View,
	type ImageSourcePropType,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useTheme } from "../../hooks/useTheme";

interface HeaderBarProps {
	title?: string;
	titleIcon?: ImageSourcePropType;
	showSpinner?: boolean;
	showBottomBorder?: boolean;
}

export function HeaderBar({
	title = "Moments",
	titleIcon,
	showSpinner = false,
	showBottomBorder = true,
}: HeaderBarProps) {
	const { colors, metrics, typography } = useTheme();
	const router = useRouter();

	const styles = React.useMemo(
		() =>
			StyleSheet.create({
				root: {
					flexDirection: "row",
					alignItems: "center",
					justifyContent: "space-between",
					paddingHorizontal: metrics.md,
					paddingTop: metrics.sm,
					paddingBottom: metrics.sm,
					backgroundColor: colors.background,
					borderBottomWidth: showBottomBorder ? 1 : 0,
					borderBottomColor: colors.borderDark,
				},
				left: {
					flexDirection: "row",
					alignItems: "center",
				},
				titleCreateTap: {
					marginRight: metrics.sm,
				},
				title: {
					color: colors.textPrimary,
					fontSize: typography.sizes.lg,
					fontWeight: "700",
					letterSpacing: 0.2,
				},
				right: {
					flexDirection: "row",
					alignItems: "center",
					gap: metrics.md,
				},
				iconTap: {
					alignItems: "center",
					justifyContent: "center",
					opacity: 0.9,
				},
				addCircle: {
					width: metrics.icon.md,
					height: metrics.icon.md,
					borderRadius: metrics.radius.full,
					borderWidth: 1.6,
					borderColor: colors.icon,
					alignItems: "center",
					justifyContent: "center",
				},
				spinnerWrap: {
					position: "absolute",
					top: metrics.xs,
					left: 0,
					right: 0,
					alignItems: "center",
				},
			}),
		[colors, metrics, showBottomBorder, typography],
	);

	return (
		<View style={styles.root}>
			{showSpinner ? (
				<View style={styles.spinnerWrap}>
					<ActivityIndicator color={colors.spinnerHead} size="small" />
				</View>
			) : null}

			<View style={styles.left}>
				<Pressable
					android_ripple={{ color: colors.overlayLight }}
					onPress={() => router.push("/create")}
					style={[styles.iconTap, styles.titleCreateTap]}
				>
					<View style={styles.addCircle}>
						<Ionicons
							color={colors.icon}
							name="add"
							size={metrics.icon.sm + 1}
						/>
					</View>
				</Pressable>

				{titleIcon ? (
					<Image
						source={titleIcon}
						style={{ width: 20, height: 20, marginRight: metrics.sm }}
					/>
				) : null}
				<Text style={styles.title}>{title}</Text>
			</View>

			<View style={styles.right}>
				<Pressable
					android_ripple={{ color: colors.overlayLight }}
					onPress={() => router.push("/community")}
					style={styles.iconTap}
				>
					<Ionicons
						color={colors.icon}
						name="people-outline"
						size={metrics.icon.md - 2}
					/>
				</Pressable>

				<Pressable
					android_ripple={{ color: colors.overlayLight }}
					onPress={() => router.push("/chats")}
					style={styles.iconTap}
				>
					<Ionicons
						color={colors.icon}
						name="chatbubble-outline"
						size={metrics.icon.md - 2}
					/>
				</Pressable>

				<Pressable
					android_ripple={{ color: colors.overlayLight }}
					onPress={() => router.push("/notifications")}
					style={styles.iconTap}
				>
					<Ionicons
						color={colors.icon}
						name="notifications-outline"
						size={metrics.icon.md - 2}
					/>
				</Pressable>
			</View>
		</View>
	);
}
