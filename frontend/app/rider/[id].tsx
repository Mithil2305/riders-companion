import React from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import ProfileService from "../../src/services/ProfileService";
import { useTheme } from "../../src/hooks/useTheme";

type RiderProfile = {
	id: string;
	name: string;
	username: string;
	bio: string | null;
	profileImageUrl: string | null;
};

const FALLBACK_PROFILE: RiderProfile = {
	id: "",
	name: "Rider",
	username: "rider",
	bio: null,
	profileImageUrl: null,
};

export default function RiderProfileScreen() {
	const { colors, metrics, typography } = useTheme();
	const router = useRouter();
	const params = useLocalSearchParams();
	const riderId = typeof params.id === "string" ? params.id : "";
	const [profile, setProfile] = React.useState<RiderProfile>(FALLBACK_PROFILE);
	const [isLoading, setIsLoading] = React.useState(true);

	React.useEffect(() => {
		let active = true;

		if (!riderId) {
			setIsLoading(false);
			return () => {
				active = false;
			};
		}

		ProfileService.getRiderProfile(riderId)
			.then((response) => {
				if (!active) {
					return;
				}

				setProfile({
					id: response.profile.id,
					name: response.profile.name,
					username: response.profile.username,
					bio: response.profile.bio,
					profileImageUrl: response.profile.profileImageUrl,
				});
			})
			.catch(() => {
				if (!active) {
					return;
				}
				setProfile({ ...FALLBACK_PROFILE, id: riderId });
			})
			.finally(() => {
				if (!active) {
					return;
				}
				setIsLoading(false);
			});

		return () => {
			active = false;
		};
	}, [riderId]);

	const avatarUri =
		profile.profileImageUrl && profile.profileImageUrl.trim().length > 0
			? profile.profileImageUrl
			: `https://ui-avatars.com/api/?name=${encodeURIComponent(
					profile.name || "Rider",
				)}&background=0D8ABC&color=fff`;

	const styles = React.useMemo(
		() =>
			StyleSheet.create({
				container: {
					flex: 1,
					backgroundColor: colors.background,
					paddingHorizontal: metrics.md,
				},
				headerRow: {
					flexDirection: "row",
					alignItems: "center",
					paddingTop: metrics.md,
					paddingBottom: metrics.lg,
				},
				backTap: {
					width: 36,
					height: 36,
					borderRadius: metrics.radius.full,
					alignItems: "center",
					justifyContent: "center",
				},
				title: {
					color: colors.textPrimary,
					fontSize: typography.sizes.lg,
					fontWeight: "700",
					marginLeft: metrics.sm,
				},
				content: {
					alignItems: "center",
					paddingTop: metrics.lg,
				},
				avatar: {
					width: 112,
					height: 112,
					borderRadius: metrics.radius.full,
					backgroundColor: colors.surface,
				},
				name: {
					marginTop: metrics.md,
					color: colors.textPrimary,
					fontSize: typography.sizes.xl,
					fontWeight: "700",
				},
				username: {
					marginTop: 2,
					color: colors.textSecondary,
					fontSize: typography.sizes.base,
					fontWeight: "500",
				},
				bio: {
					marginTop: metrics.sm,
					color: colors.textSecondary,
					fontSize: typography.sizes.base,
					textAlign: "center",
				},
				loading: {
					marginTop: metrics.lg,
					color: colors.textTertiary,
					fontSize: typography.sizes.sm,
					fontWeight: "500",
				},
			}),
		[colors, metrics, typography],
	);

	return (
		<SafeAreaView edges={["top", "left", "right"]} style={styles.container}>
			<View style={styles.headerRow}>
				<Pressable onPress={() => router.back()} style={styles.backTap}>
					<Ionicons color={colors.textPrimary} name="arrow-back" size={24} />
				</Pressable>
				<Text style={styles.title}>Rider Profile</Text>
			</View>

			<View style={styles.content}>
				<Image source={{ uri: avatarUri }} style={styles.avatar} />
				<Text numberOfLines={1} style={styles.name}>
					{profile.name}
				</Text>
				<Text numberOfLines={1} style={styles.username}>
					@{profile.username || "rider"}
				</Text>
				{profile.bio ? <Text style={styles.bio}>{profile.bio}</Text> : null}
				{isLoading ? (
					<Text style={styles.loading}>Loading rider details...</Text>
				) : null}
			</View>
		</SafeAreaView>
	);
}
