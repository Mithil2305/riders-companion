import React from "react";
import { StyleProp, ViewStyle } from "react-native";
import { VideoView, useVideoPlayer } from "expo-video";

export function ClipThumbnail({
	style,
	uri,
}: {
	style: StyleProp<ViewStyle>;
	uri: string;
}) {
	const player = useVideoPlayer(uri, (instance) => {
		instance.loop = true;
		instance.muted = true;
		instance.play();
	});

	React.useEffect(() => {
		player.muted = true;
		player.play();

		return () => {
			player.pause();
		};
	}, [player]);

	return (
		<VideoView
			contentFit="cover"
			nativeControls={false}
			player={player}
			style={style}
		/>
	);
}
