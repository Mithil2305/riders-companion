import React from "react";
import { Image, StyleProp, StyleSheet, View, ViewStyle } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../hooks/useTheme";

export function ClipThumbnail({
	style,
	uri,
}: {
	style: StyleProp<ViewStyle>;
	uri?: string | null;
}) {
	const { colors, metrics } = useTheme();

	const styles = React.useMemo(
		() =>
			StyleSheet.create({
				container: {
					backgroundColor: colors.surface,
					alignItems: "center",
					justifyContent: "center",
					overflow: "hidden",
				},
				image: {
					width: "100%",
					height: "100%",
				},
			}),
		[colors],
	);

	return (
		<View style={[styles.container, style]}>
			{uri ? (
				<Image resizeMode="cover" source={{ uri }} style={styles.image} />
			) : (
				<Ionicons color={colors.textSecondary} name="videocam-outline" size={metrics.icon.lg} />
			)}
		</View>
	);
}
