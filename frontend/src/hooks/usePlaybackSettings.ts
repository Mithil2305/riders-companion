import { usePlaybackSettingsContext } from "../contexts/PlaybackSettingsContext";

export function usePlaybackSettings() {
	return usePlaybackSettingsContext();
}
