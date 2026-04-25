import React, {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useState,
} from "react";
import * as SecureStore from "expo-secure-store";

const DATA_SAVER_KEY = "video_data_saver_enabled";

interface PlaybackSettingsContextValue {
	dataSaverEnabled: boolean;
	isRestoring: boolean;
	setDataSaverEnabled: (value: boolean) => Promise<void>;
	toggleDataSaver: () => Promise<void>;
}

const PlaybackSettingsContext = createContext<
	PlaybackSettingsContextValue | undefined
>(undefined);

export function PlaybackSettingsProvider({
	children,
}: {
	children: React.ReactNode;
}) {
	const [dataSaverEnabled, setDataSaverEnabledState] = useState(false);
	const [isRestoring, setIsRestoring] = useState(true);

	useEffect(() => {
		const restoreSettings = async () => {
			try {
				const storedValue = await SecureStore.getItemAsync(DATA_SAVER_KEY);
				setDataSaverEnabledState(storedValue === "true");
			} finally {
				setIsRestoring(false);
			}
		};

		void restoreSettings();
	}, []);

	const setDataSaverEnabled = useCallback(async (value: boolean) => {
		setDataSaverEnabledState(value);
		await SecureStore.setItemAsync(DATA_SAVER_KEY, value ? "true" : "false");
	}, []);

	const toggleDataSaver = useCallback(async () => {
		await setDataSaverEnabled(!dataSaverEnabled);
	}, [dataSaverEnabled, setDataSaverEnabled]);

	const value = useMemo(
		() => ({
			dataSaverEnabled,
			isRestoring,
			setDataSaverEnabled,
			toggleDataSaver,
		}),
		[dataSaverEnabled, isRestoring, setDataSaverEnabled, toggleDataSaver],
	);

	return (
		<PlaybackSettingsContext.Provider value={value}>
			{children}
		</PlaybackSettingsContext.Provider>
	);
}

export function usePlaybackSettingsContext() {
	const context = useContext(PlaybackSettingsContext);
	if (context === undefined) {
		throw new Error(
			"usePlaybackSettingsContext must be used within PlaybackSettingsProvider",
		);
	}

	return context;
}
