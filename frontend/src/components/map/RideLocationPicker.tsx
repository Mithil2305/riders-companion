import React from 'react';
import {
	ActivityIndicator,
	Platform,
	Pressable,
	StyleSheet,
	Text,
	TextInput,
	View,
	type StyleProp,
	type TextStyle,
	type ViewStyle,
} from 'react-native';
import MapView, {
	Marker,
	PROVIDER_DEFAULT,
	PROVIDER_GOOGLE,
	type LatLng,
	type Region,
} from 'react-native-maps';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { withAlpha } from '../../utils/color';

export interface RideLocationValue {
	placeName: string;
	latitude: number;
	longitude: number;
}

interface RideLocationSuggestion {
	description: string;
	placeId: string;
}

interface RideLocationPickerProps {
	label: string;
	value: RideLocationValue | null;
	onChange: (location: RideLocationValue) => void;
	showCurrentLocationAction?: boolean;
}

type MapPreviewStyles = {
	mapCard: StyleProp<ViewStyle>;
	mapOverlay: StyleProp<ViewStyle>;
	mapBadge: StyleProp<ViewStyle>;
	mapBadgeText: StyleProp<TextStyle>;
	markerOuter: StyleProp<ViewStyle>;
	markerInner: StyleProp<ViewStyle>;
};

interface MapPreviewProps {
	region: Region;
	marker: LatLng;
	onMapPress: (coordinate: LatLng) => void;
	isResolvingLocation: boolean;
	styles: MapPreviewStyles;
	markerColor: string;
	badgeColor: string;
}

const GOOGLE_MAPS_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ?? '';
const SEARCH_DEBOUNCE_MS = 320;
const MIN_QUERY_LENGTH = 3;
const DEFAULT_REGION: Region = {
	latitude: 11.0017,
	longitude: 76.9619,
	latitudeDelta: 0.06,
	longitudeDelta: 0.06,
};

let sharedCurrentLocationPromise: Promise<LatLng | null> | null = null;

async function fetchJson<T>(url: string): Promise<T | null> {
	try {
		const response = await fetch(url);
		if (!response.ok) {
			return null;
		}

		return (await response.json()) as T;
	} catch {
		return null;
	}
}

async function searchLocations(query: string): Promise<RideLocationSuggestion[]> {
	if (!GOOGLE_MAPS_API_KEY || query.trim().length < MIN_QUERY_LENGTH) {
		return [];
	}

	const endpoint =
		'https://maps.googleapis.com/maps/api/place/autocomplete/json?' +
		`input=${encodeURIComponent(query.trim())}` +
		'&types=geocode' +
		`&key=${encodeURIComponent(GOOGLE_MAPS_API_KEY)}`;

	const data = await fetchJson<{
		predictions?: Array<{ description?: string; place_id?: string }>;
	}>(endpoint);

	return (data?.predictions ?? [])
		.map((item) => ({
			description: item.description?.trim() ?? '',
			placeId: item.place_id?.trim() ?? '',
		}))
		.filter(
			(item) => item.description.length > 0 && item.placeId.length > 0,
		)
		.slice(0, 5);
}

async function getPlaceDetails(placeId: string): Promise<RideLocationValue | null> {
	if (!GOOGLE_MAPS_API_KEY || placeId.trim().length === 0) {
		return null;
	}

	const endpoint =
		'https://maps.googleapis.com/maps/api/place/details/json?' +
		`place_id=${encodeURIComponent(placeId.trim())}` +
		'&fields=geometry,name,formatted_address' +
		`&key=${encodeURIComponent(GOOGLE_MAPS_API_KEY)}`;

	const data = await fetchJson<{
		result?: {
			name?: string;
			formatted_address?: string;
			geometry?: { location?: { lat?: number; lng?: number } };
		};
	}>(endpoint);

	const location = data?.result?.geometry?.location;
	if (
		typeof location?.lat !== 'number' ||
		typeof location?.lng !== 'number'
	) {
		return null;
	}

	const placeName =
		data?.result?.formatted_address?.trim() ||
		data?.result?.name?.trim() ||
		'Picked location';

	return {
		placeName,
		latitude: location.lat,
		longitude: location.lng,
	};
}

async function reverseGeocode(coordinate: LatLng): Promise<string | null> {
	if (!GOOGLE_MAPS_API_KEY) {
		return null;
	}

	const endpoint =
		'https://maps.googleapis.com/maps/api/geocode/json?' +
		`latlng=${coordinate.latitude},${coordinate.longitude}` +
		`&key=${encodeURIComponent(GOOGLE_MAPS_API_KEY)}`;

	const data = await fetchJson<{
		results?: Array<{ formatted_address?: string; address_components?: Array<{ long_name?: string }> }>;
	}>(endpoint);

	const formattedAddress = data?.results?.[0]?.formatted_address?.trim();
	if (formattedAddress) {
		return formattedAddress;
	}

	return data?.results?.[0]?.address_components?.[0]?.long_name?.trim() ?? null;
}

async function getCurrentCoordinates(): Promise<LatLng | null> {
	if (!sharedCurrentLocationPromise) {
		sharedCurrentLocationPromise = (async () => {
			try {
				const cached = await Location.getLastKnownPositionAsync();
				if (cached?.coords) {
					return {
						latitude: cached.coords.latitude,
						longitude: cached.coords.longitude,
					};
				}

				const permission = await Location.requestForegroundPermissionsAsync();
				if (permission.status !== 'granted') {
					return null;
				}

				const current = await Location.getCurrentPositionAsync({
					accuracy: Location.Accuracy.Balanced,
				});

				return {
					latitude: current.coords.latitude,
					longitude: current.coords.longitude,
				};
			} catch {
				return null;
			} finally {
				sharedCurrentLocationPromise = null;
			}
		})();
	}

	return sharedCurrentLocationPromise;
}

const MapPreview = React.memo(function MapPreview({
	region,
	marker,
	onMapPress,
	isResolvingLocation,
	styles,
	markerColor,
	badgeColor,
}: MapPreviewProps) {
	return (
		<View style={styles.mapCard}>
			<MapView
				provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : PROVIDER_DEFAULT}
				style={StyleSheet.absoluteFillObject}
				region={region}
				onPress={(event) => {
					onMapPress(event.nativeEvent.coordinate);
				}}
				scrollEnabled={false}
				zoomEnabled={false}
				rotateEnabled={false}
				pitchEnabled={false}
				toolbarEnabled={false}
				loadingEnabled
			>
				<Marker coordinate={marker} tracksViewChanges={false}>
					<View style={styles.markerOuter}>
						<View style={styles.markerInner}>
							<Ionicons name="location" size={18} color={badgeColor} />
						</View>
					</View>
				</Marker>
			</MapView>
			<View style={styles.mapOverlay} />
			<View style={styles.mapBadge}>
				{isResolvingLocation ? (
					<ActivityIndicator color={markerColor} size="small" />
				) : (
					<Ionicons name="navigate" size={14} color={markerColor} />
				)}
				<Text style={styles.mapBadgeText}>Map preview</Text>
			</View>
		</View>
	);
});

function getRegionFromCoordinate(coordinate: LatLng): Region {
	return {
		latitude: coordinate.latitude,
		longitude: coordinate.longitude,
		latitudeDelta: 0.02,
		longitudeDelta: 0.02,
	};
}

export function RideLocationPicker({
	label,
	value,
	onChange,
	showCurrentLocationAction = false,
}: RideLocationPickerProps) {
	const { colors, metrics, typography } = useTheme();
	const palette = React.useMemo(
		() => ({
			background: colors.background,
			surface: colors.surface,
			text: colors.textPrimary,
			primary: colors.primary,
			border: colors.border,
			subtleBorder: colors.borderDark,
			overlay: colors.overlay,
			shadow: colors.shadow,
			inputBackground: colors.surfaceMuted,
			placeholder: colors.textTertiary,
			chipBackground: colors.surfaceRaised,
		}),
		[
			colors
		],
	);
	const [query, setQuery] = React.useState(value?.placeName ?? '');
	const [suggestions, setSuggestions] = React.useState<RideLocationSuggestion[]>([]);
	const [isSearching, setIsSearching] = React.useState(false);
	const [currentLocation, setCurrentLocation] = React.useState<LatLng | null>(null);
	const [isResolvingCurrentLocation, setIsResolvingCurrentLocation] = React.useState(false);

	React.useEffect(() => {
		setQuery(value?.placeName ?? '');
	}, [value?.placeName]);

	React.useEffect(() => {
		let active = true;

		void getCurrentCoordinates().then((coordinate) => {
			if (active) {
				setCurrentLocation(coordinate);
			}
		});

		return () => {
			active = false;
		};
	}, []);

	React.useEffect(() => {
		const normalizedQuery = query.trim();
		if (normalizedQuery.length < MIN_QUERY_LENGTH) {
			setSuggestions([]);
			setIsSearching(false);
			return;
		}

		let cancelled = false;
		const timer = setTimeout(() => {
			setIsSearching(true);
			void searchLocations(normalizedQuery)
				.then((items) => {
					if (!cancelled) {
						setSuggestions(items);
					}
				})
				.catch(() => {
					if (!cancelled) {
						setSuggestions([]);
					}
				})
				.finally(() => {
					if (!cancelled) {
						setIsSearching(false);
					}
				});
		}, SEARCH_DEBOUNCE_MS);

		return () => {
			cancelled = true;
			clearTimeout(timer);
		};
	}, [query]);

	const mapMarker = React.useMemo<LatLng>(() => {
		if (value) {
			return {
				latitude: value.latitude,
				longitude: value.longitude,
			};
		}

		if (currentLocation) {
			return currentLocation;
		}

		return {
			latitude: DEFAULT_REGION.latitude,
			longitude: DEFAULT_REGION.longitude,
		};
	}, [currentLocation, value]);

	const mapRegion = React.useMemo<Region>(
		() => getRegionFromCoordinate(mapMarker),
		[mapMarker],
	);

	const handleSelectSuggestion = React.useCallback(
		async (suggestion: RideLocationSuggestion) => {
			setIsSearching(false);
			setSuggestions([]);
			setQuery(suggestion.description);

			try {
				const location = await getPlaceDetails(suggestion.placeId);
				if (location) {
					onChange(location);
					return;
				}
			} catch {
				// Fall back to the selected suggestion text when geocoding fails.
			}

			onChange({
				placeName: suggestion.description,
				latitude: mapMarker.latitude,
				longitude: mapMarker.longitude,
			});
		},
		[mapMarker.latitude, mapMarker.longitude, onChange],
	);

	const handleMapPress = React.useCallback(
		async (coordinate: LatLng) => {
			setIsResolvingCurrentLocation(true);
			try {
				const placeName =
					(await reverseGeocode(coordinate)) ?? `${coordinate.latitude.toFixed(5)}, ${coordinate.longitude.toFixed(5)}`;
				onChange({
					placeName,
					latitude: coordinate.latitude,
					longitude: coordinate.longitude,
				});
			} finally {
				setIsResolvingCurrentLocation(false);
			}
		},
		[onChange],
	);

	const handleUseCurrentLocation = React.useCallback(async () => {
		setIsResolvingCurrentLocation(true);
		try {
			const coordinate = await getCurrentCoordinates();
			if (!coordinate) {
				return;
			}

			const placeName =
				(await reverseGeocode(coordinate)) ?? 'Current location';
			onChange({
				placeName,
				latitude: coordinate.latitude,
				longitude: coordinate.longitude,
			});
			setQuery(placeName);
		} finally {
			setIsResolvingCurrentLocation(false);
		}
	}, [onChange]);

	const styles = React.useMemo(
		() =>
			StyleSheet.create({
				container: {
					marginTop: metrics.sm,
				},
				labelRow: {
					flexDirection: 'row',
					alignItems: 'center',
					justifyContent: 'space-between',
					marginBottom: 6,
				},
				label: {
					fontSize: typography.sizes.sm,
					fontWeight: '500',
					color: palette.text,
				},
				locationAction: {
					color: palette.primary,
					fontSize: typography.sizes.xs,
					fontWeight: '500',
				},
				input: {
					height: 54,
					paddingHorizontal: metrics.md,
					borderRadius: 12,
					backgroundColor: palette.inputBackground,
					color: palette.text,
					fontSize: typography.sizes.base,
					borderWidth: 1,
					borderColor: palette.border,
				},
				suggestionWrap: {
					marginTop: 8,
					borderRadius: 12,
					borderWidth: 1,
					borderColor: palette.border,
					backgroundColor: palette.surface,
					overflow: 'hidden',
				},
				suggestionRow: {
					paddingHorizontal: metrics.md,
					paddingVertical: 11,
					borderBottomWidth: 1,
					borderBottomColor: palette.border,
				},
				suggestionText: {
					color: palette.text,
					fontSize: typography.sizes.sm,
				},
				loadingRow: {
					paddingTop: 10,
					alignItems: 'center',
				},
				mapCard: {
					marginTop: metrics.md,
					height: 350,
					borderRadius: 20,
					overflow: 'hidden',
					backgroundColor: palette.background,
					borderWidth: 1,
					borderColor: palette.subtleBorder,
					// shadowColor: palette.shadow,
					// shadowOpacity: 0.24,
					// shadowRadius: 16,
					// shadowOffset: { width: 0, height: 8 },
					// elevation: 6,
				},
				mapOverlay: {
					...StyleSheet.absoluteFillObject,
				},
				mapBadge: {
					position: 'absolute',
					left: metrics.sm,
					bottom: metrics.sm,
					flexDirection: 'row',
					alignItems: 'center',
					gap: 6,
					paddingHorizontal: metrics.sm,
					paddingVertical: 6,
					borderRadius: 999,
					backgroundColor: palette.chipBackground,
					borderWidth: 1,
					borderColor: palette.border,
				},
				mapBadgeText: {
					fontSize: typography.sizes.xs,
					fontWeight: '500',
					color: palette.text,
				},
				markerOuter: {
					width: 30,
					height: 30,
					borderRadius: 15,
					backgroundColor: withAlpha(palette.primary, 0.22),
					alignItems: 'center',
					justifyContent: 'center',
				},
				markerInner: {
					width: 22,
					height: 22,
					borderRadius: 11,
					backgroundColor: palette.primary,
					alignItems: 'center',
					justifyContent: 'center',
				},
			}),
		[
			metrics.md,
			metrics.sm,
			palette.background,
			palette.border,
			palette.chipBackground,
			palette.inputBackground,
			palette.overlay,
			palette.primary,
			palette.shadow,
			palette.subtleBorder,
			palette.surface,
			palette.text,
			typography.sizes.base,
			typography.sizes.sm,
			typography.sizes.xs,
		],
	);

	return (
		<View style={styles.container}>
			<View style={styles.labelRow}>
				<Text style={styles.label}>{label}</Text>
				{showCurrentLocationAction ? (
					<Pressable
						onPress={() => {
							void handleUseCurrentLocation();
						}}
						disabled={isResolvingCurrentLocation}
					>
						<Text style={styles.locationAction}>
							{isResolvingCurrentLocation ? 'Fetching location...' : 'Use current location'}
						</Text>
					</Pressable>
				) : null}
			</View>

			<TextInput
				style={styles.input}
				placeholder={`Enter ${label}`}
				placeholderTextColor={palette.placeholder}
				value={query}
				onChangeText={setQuery}
				editable={!isResolvingCurrentLocation}
			/>

			{isSearching ? (
				<View style={styles.loadingRow}>
					<ActivityIndicator color={palette.primary} size="small" />
				</View>
			) : null}

			{suggestions.length > 0 ? (
				<View style={styles.suggestionWrap}>
					{suggestions.map((item, index) => (
						<Pressable
							key={`${item.placeId}-${index}`}
							onPress={() => {
								void handleSelectSuggestion(item);
							}}
							style={styles.suggestionRow}
						>
							<Text style={styles.suggestionText}>{item.description}</Text>
						</Pressable>
					))}
				</View>
			) : null}

			<MapPreview
				region={mapRegion}
				marker={mapMarker}
				onMapPress={handleMapPress}
				isResolvingLocation={isResolvingCurrentLocation}
				styles={styles}
				markerColor={palette.primary}
				badgeColor={colors.textPrimary}
			/>
		</View>
	);
}
