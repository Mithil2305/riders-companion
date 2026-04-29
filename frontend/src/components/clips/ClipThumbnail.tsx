import React from "react";
import { Image, type ImageStyle, StyleProp, StyleSheet, View, type ViewStyle } from "react-native";
import { VideoView, useVideoPlayer } from "expo-video";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../hooks/useTheme";

function VideoSnap({ uri, style }: { uri: string; style?: StyleProp<ViewStyle> }) {
	const player = useVideoPlayer(uri, (instance) => {
		instance.loop = false;
		instance.muted = true;
		instance.play();
	});

	React.useEffect(() => {
		const interval = setInterval(() => {
			if (player.duration > 0) {
				const randomTime = Math.random() * player.duration;
				player.currentTime = randomTime;
				clearInterval(interval);
				setTimeout(() => {
					player.pause();
				}, 200);
			}
		}, 100);
		return () => clearInterval(interval);
	}, [player]);

	return (
		<View style={style}>
			<VideoView
				contentFit="cover"
				nativeControls={false}
				player={player}
				style={StyleSheet.absoluteFill}
			/>
		</View>
	);
}

function VideoThumbnailFallback({
	uri,
	style,
}: {
	uri: string;
	style: StyleProp<ImageStyle>;
}) {
	const [imageError, setImageError] = React.useState(false);

	if (!imageError) {
		return (
			<Image
				resizeMode="cover"
				source={{ uri }}
				style={style}
				onError={() => setImageError(true)}
			/>
		);
	}

	return <VideoSnap style={style as StyleProp<ViewStyle>} uri={uri} />;
}

export function ClipThumbnail({
	style,
	uri,
	videoUri,
}: {
	style: StyleProp<ViewStyle>;
	uri?: string | null;
	videoUri?: string | null;
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
			) : videoUri ? (
				<VideoThumbnailFallback style={styles.image} uri={videoUri} />
			) : (
				<Ionicons color={colors.textSecondary} name="videocam-outline" size={metrics.icon.lg} />
			)}
		</View>
	);
}
