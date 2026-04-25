import React from "react";
import { StyleProp, ViewStyle } from "react-native";
import { StreamingVideo } from "../common";

export function ClipThumbnail({
	style,
	uri,
}: {
	style: StyleProp<ViewStyle>;
	uri: string;
}) {
	return (
		<StreamingVideo
			contentFit="cover"
			muted
			shouldPlay
			style={style}
			uri={uri}
		/>
	);
}
