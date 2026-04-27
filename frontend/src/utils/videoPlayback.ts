import { BufferOptions, ContentType, VideoSource } from "expo-video";

const inferContentType = (uri: string): ContentType => {
	const normalized = uri.toLowerCase();
	if (normalized.includes(".m3u8")) {
		return "hls";
	}

	if (normalized.includes(".mpd")) {
		return "dash";
	}

	return "progressive";
};

export const getVideoBufferOptions = (
	dataSaverEnabled: boolean,
): BufferOptions => {
	if (dataSaverEnabled) {
		return {
			preferredForwardBufferDuration: 2.5,
			minBufferForPlayback: 0.8,
			maxBufferBytes: 1_200_000,
			prioritizeTimeOverSizeThreshold: true,
			waitsToMinimizeStalling: false,
		};
	}

	return {
		preferredForwardBufferDuration: 10,
		minBufferForPlayback: 1.5,
		maxBufferBytes: 0,
		prioritizeTimeOverSizeThreshold: false,
		waitsToMinimizeStalling: true,
	};
};

export const getVideoPreloadRadius = (dataSaverEnabled: boolean) =>
	dataSaverEnabled ? 2 : 3;

export const buildStreamingVideoSource = (
	uri: string,
	dataSaverEnabled: boolean,
): VideoSource => ({
	uri,
	useCaching: true,
	contentType: inferContentType(uri),
	headers: dataSaverEnabled ? { "Save-Data": "on" } : undefined,
});
