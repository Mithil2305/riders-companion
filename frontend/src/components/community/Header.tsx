import React from "react";
import { Ionicons } from "@expo/vector-icons";
import {
	StyleSheet,
	Text,
	TextInput,
	TouchableOpacity,
	View,
} from "react-native";
import { useLocation } from "../../hooks/useLocation";
import { useTheme } from "../../hooks/useTheme";
import { useRideLocationSuggestions } from "../../hooks/useRideLocationSuggestions";
import { withAlpha } from "../../utils/color";

interface HeaderProps {
	onBack: () => void;
	onStartRide: () => void;
	selectedLocation: string;
	onChangeLocation: (value: string) => void;
}

export function Header({
	onBack,
	onStartRide,
	selectedLocation,
	onChangeLocation,
}: HeaderProps) {
	const { colors, metrics, typography } = useTheme();
	const { suggestions, isSearching } =
		useRideLocationSuggestions(selectedLocation);
	const { getCurrentLocation, loading: isResolvingLocation } = useLocation({
		autoRequest: false,
	});
	const [showSuggestions, setShowSuggestions] = React.useState(false);
	const blurTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(
		null,
	);
	const apiKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";

	React.useEffect(() => {
		return () => {
			if (blurTimeoutRef.current) {
				clearTimeout(blurTimeoutRef.current);
			}
		};
	}, []);

	const reverseGeocode = React.useCallback(
		async (latitude: number, longitude: number) => {
			if (!apiKey) {
				return null;
			}

			const endpoint =
				"https://maps.googleapis.com/maps/api/geocode/json?" +
				`latlng=${latitude},${longitude}` +
				"&result_type=locality|administrative_area_level_1|administrative_area_level_2" +
				"&location_type=APPROXIMATE" +
				`&key=${encodeURIComponent(apiKey)}`;

			try {
				const response = await fetch(endpoint);
				if (!response.ok) {
					return null;
				}

				const data = (await response.json()) as {
					results?: Array<{ formatted_address?: string }>;
				};

				return data.results?.[0]?.formatted_address?.trim() ?? null;
			} catch {
				return null;
			}
		},
		[apiKey],
	);

	const handleUseCurrentLocation = React.useCallback(async () => {
		const current = await getCurrentLocation();
		if (!current) {
			return;
		}

		const placeName =
			(await reverseGeocode(current.latitude, current.longitude)) ??
			`${current.latitude.toFixed(5)}, ${current.longitude.toFixed(5)}`;
		onChangeLocation(placeName);
		setShowSuggestions(false);
	}, [getCurrentLocation, onChangeLocation, reverseGeocode]);

	const styles = React.useMemo(
		() =>
			StyleSheet.create({
				root: {
					paddingHorizontal: metrics.md,
					paddingTop: metrics.md,
					paddingBottom: metrics.md,
					flexDirection: "row",
					alignItems: "center",
					justifyContent: "space-between",
					backgroundColor: colors.background,
				},
				left: {
					flex: 1,
				},
				titleRow: {
					flexDirection: "row",
					alignItems: "center",
				},
				title: {
					color: colors.textPrimary,
					fontSize: typography.sizes["2xl"],
					fontWeight: "800",
					letterSpacing: -0.5,
				},
				subtitlePill: {
					marginTop: metrics.xs,
					flexDirection: "row",
					alignItems: "center",
					backgroundColor: withAlpha(colors.primary, 0.12),
					paddingHorizontal: metrics.sm,
					paddingVertical: 2,
					borderRadius: metrics.radius.full,
					borderWidth: 1,
					borderColor: withAlpha(colors.primary, 0.2),
					minWidth: 170,
					position: "relative",
				},
				locationChip: {
					marginLeft: metrics.xs,
					paddingHorizontal: metrics.sm,
					paddingVertical: 4,
					borderRadius: metrics.radius.full,
					borderWidth: 1,
					borderColor: withAlpha(colors.primary, 0.35),
					backgroundColor: colors.surface,
				},
				locationChipText: {
					color: colors.primary,
					fontSize: typography.sizes.xs,
					fontWeight: "700",
					letterSpacing: 0.3,
				},
				suggestionWrap: {
					position: "absolute",
					top: 42,
					left: 0,
					right: 0,
					backgroundColor: colors.surface,
					borderRadius: metrics.radius.md,
					borderWidth: 1,
					borderColor: colors.border,
					shadowColor: colors.shadow,
					shadowOpacity: 0.2,
					shadowRadius: 10,
					shadowOffset: { width: 0, height: 6 },
					elevation: 6,
					paddingVertical: metrics.xs,
					zIndex: 10,
				},
				suggestionRow: {
					paddingVertical: metrics.xs + 2,
					paddingHorizontal: metrics.sm,
				},
				suggestionText: {
					color: colors.textPrimary,
					fontSize: typography.sizes.xs,
					fontWeight: "600",
				},
				suggestionHint: {
					paddingHorizontal: metrics.sm,
					paddingBottom: metrics.xs,
					color: colors.textSecondary,
					fontSize: typography.sizes.xs,
					fontWeight: "500",
				},
				locationInput: {
					flex: 1,
					color: colors.primary,
					fontSize: typography.sizes.xs,
					fontWeight: "700",
					letterSpacing: 0.4,
					marginLeft: 4,
					paddingVertical: 4,
				},
				cta: {
					height: 40,
					borderRadius: metrics.radius.full,
					backgroundColor: colors.primary,
					paddingHorizontal: metrics.lg,
					flexDirection: "row",
					alignItems: "center",
					justifyContent: "center",
					shadowColor: colors.primary,
					shadowOffset: { width: 0, height: 4 },
					shadowOpacity: 0.25,
					shadowRadius: 8,
					elevation: 4,
				},
				ctaLabel: {
					color: colors.textInverse,
					fontSize: typography.sizes.sm,
					fontWeight: "800",
					marginLeft: 6,
				},
			}),
		[colors, metrics, typography],
	);

	return (
		<View style={styles.root}>
			<View style={styles.left}>
				<View style={styles.titleRow}>
					<Text style={styles.title}>Community</Text>
				</View>
				<View style={styles.subtitlePill}>
					<Ionicons
						color={colors.primary}
						name="location"
						size={metrics.icon.sm - 2}
					/>
					<TextInput
						onChangeText={onChangeLocation}
						onFocus={() => {
							if (blurTimeoutRef.current) {
								clearTimeout(blurTimeoutRef.current);
								blurTimeoutRef.current = null;
							}
							setShowSuggestions(true);
						}}
						onBlur={() => {
							blurTimeoutRef.current = setTimeout(() => {
								setShowSuggestions(false);
							}, 160);
						}}
						placeholder="Filter by location"
						placeholderTextColor={withAlpha(colors.primary, 0.6)}
						style={styles.locationInput}
						value={selectedLocation}
					/>
					<TouchableOpacity
						activeOpacity={0.8}
						onPress={() => {
							void handleUseCurrentLocation();
						}}
						style={styles.locationChip}
					>
						<Text style={styles.locationChipText}>
							{isResolvingLocation ? "Locating..." : "Use current"}
						</Text>
					</TouchableOpacity>
					{showSuggestions && (isSearching || suggestions.length > 0) ? (
						<View style={styles.suggestionWrap}>
							{isSearching ? (
								<Text style={styles.suggestionHint}>Searching...</Text>
							) : null}
							{suggestions.map((item, index) => (
								<TouchableOpacity
									activeOpacity={0.85}
									key={`${item}-${index}`}
									onPress={() => {
										onChangeLocation(item);
										setShowSuggestions(false);
									}}
									style={styles.suggestionRow}
								>
									<Text style={styles.suggestionText}>{item}</Text>
								</TouchableOpacity>
							))}
						</View>
					) : null}
				</View>
			</View>

			<TouchableOpacity
				activeOpacity={0.9}
				onPress={onStartRide}
				style={styles.cta}
			>
				<Ionicons
					color={colors.textInverse}
					name="add"
					size={metrics.icon.sm + 2}
				/>
				<Text style={styles.ctaLabel}>Start Ride</Text>
			</TouchableOpacity>
		</View>
	);
}
