import React from "react";
import {
	ActivityIndicator,
	StyleProp,
	StyleSheet,
	View,
	ViewStyle,
} from "react-native";
import { VideoContentFit, VideoView, useVideoPlayer } from "expo-video";
import { useTheme } from "../../hooks/useTheme";
import { usePlaybackSettings } from "../../hooks/usePlaybackSettings";
import {
	buildStreamingVideoSource,
	getVideoBufferOptions,
} from "../../utils/videoPlayback";

interface StreamingVideoProps {
	uri: string;
	style?: StyleProp<ViewStyle>;
	shouldPlay?: boolean;
	loop?: boolean;
	muted?: boolean;
	contentFit?: VideoContentFit;
}

export function StreamingVideo({
	uri,
	style,
	shouldPlay = false,
	loop = true,
	muted = true,
	contentFit = "cover",
}: StreamingVideoProps) {
	const { colors } = useTheme();
	const { dataSaverEnabled } = usePlaybackSettings();
	const [hasRenderedFrame, setHasRenderedFrame] = React.useState(false);

	const source = React.useMemo(
		() => buildStreamingVideoSource(uri, dataSaverEnabled),
		[dataSaverEnabled, uri],
	);
	const bufferOptions = React.useMemo(
		() => getVideoBufferOptions(dataSaverEnabled),
		[dataSaverEnabled],
	);

	const player = useVideoPlayer(source, (instance) => {
		instance.loop = loop;
		instance.muted = muted;
		instance.bufferOptions = bufferOptions;
		if (shouldPlay) {
			instance.play();
		} else {
			instance.pause();
		}
	});

	React.useEffect(() => {
		setHasRenderedFrame(false);
	}, [source]);

	React.useEffect(() => {
		player.loop = loop;
		player.muted = muted;
		player.bufferOptions = bufferOptions;

		if (shouldPlay) {
			player.play();
			return;
		}

		player.pause();
	}, [bufferOptions, loop, muted, player, shouldPlay]);

	return (
		<View style={style}>
			<VideoView
				contentFit={contentFit}
				nativeControls={false}
				onFirstFrameRender={() => setHasRenderedFrame(true)}
				player={player}
				style={StyleSheet.absoluteFill}
			/>
			{!hasRenderedFrame ? (
				<View
					style={[
						StyleSheet.absoluteFill,
						styles.loader,
						{ backgroundColor: colors.neutralStrong },
					]}
				>
					<ActivityIndicator color={colors.primary} size="small" />
				</View>
			) : null}
		</View>
	);
}

const styles = StyleSheet.create({
	loader: {
		alignItems: "center",
		justifyContent: "center",
	},
});
