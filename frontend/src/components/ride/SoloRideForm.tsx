import React, { useState } from 'react';
import {
	View,
	StyleSheet,
	TextInput,
	Pressable,
	Text,
	ScrollView,
	ActivityIndicator,
} from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { useLocation } from '../../hooks/useLocation';
import RideService from '../../services/RideService';

interface SoloRideFormProps {
	onStartRide: (startingPoint: string, endingPoint: string) => void;
	isLoading?: boolean;
}

export function SoloRideForm({
	onStartRide,
	isLoading = false,
}: SoloRideFormProps) {
	const { colors, typography, metrics } = useTheme();
	const [startingPoint, setStartingPoint] = useState('');
	const [endingPoint, setEndingPoint] = useState('');
	const [startingSuggestions, setStartingSuggestions] = useState<string[]>([]);
	const [endingSuggestions, setEndingSuggestions] = useState<string[]>([]);
	const [isStartingSuggestionsLoading, setIsStartingSuggestionsLoading] =
		useState(false);
	const [isEndingSuggestionsLoading, setIsEndingSuggestionsLoading] =
		useState(false);
	const [skipStartingLookup, setSkipStartingLookup] = useState(false);
	const [skipEndingLookup, setSkipEndingLookup] = useState(false);
	const [applyCurrentLocation, setApplyCurrentLocation] = useState(false);

	const {
		location,
		loading: isLocationLoading,
		getCurrentLocation,
	} = useLocation({ autoRequest: false });

	React.useEffect(() => {
		if (!applyCurrentLocation || !location) {
			return;
		}

		setStartingPoint(
			`${location.latitude.toFixed(5)}, ${location.longitude.toFixed(5)}`,
		);
		setStartingSuggestions([]);
		setApplyCurrentLocation(false);
	}, [applyCurrentLocation, location]);

	React.useEffect(() => {
		if (skipStartingLookup) {
			setSkipStartingLookup(false);
			return;
		}

		const query = startingPoint.trim();
		if (query.length < 3) {
			setStartingSuggestions([]);
			setIsStartingSuggestionsLoading(false);
			return;
		}

		let isActive = true;
		const timer = setTimeout(async () => {
			setIsStartingSuggestionsLoading(true);
			try {
				const suggestions = await RideService.searchLocations(query);
				if (isActive) {
					setStartingSuggestions(suggestions);
				}
			} catch {
				if (isActive) {
					setStartingSuggestions([]);
				}
			} finally {
				if (isActive) {
					setIsStartingSuggestionsLoading(false);
				}
			}
		}, 320);

		return () => {
			isActive = false;
			clearTimeout(timer);
		};
	}, [skipStartingLookup, startingPoint]);

	React.useEffect(() => {
		if (skipEndingLookup) {
			setSkipEndingLookup(false);
			return;
		}

		const query = endingPoint.trim();
		if (query.length < 3) {
			setEndingSuggestions([]);
			setIsEndingSuggestionsLoading(false);
			return;
		}

		let isActive = true;
		const timer = setTimeout(async () => {
			setIsEndingSuggestionsLoading(true);
			try {
				const suggestions = await RideService.searchLocations(query);
				if (isActive) {
					setEndingSuggestions(suggestions);
				}
			} catch {
				if (isActive) {
					setEndingSuggestions([]);
				}
			} finally {
				if (isActive) {
					setIsEndingSuggestionsLoading(false);
				}
			}
		}, 320);

		return () => {
			isActive = false;
			clearTimeout(timer);
		};
	}, [endingPoint, skipEndingLookup]);

	const handleSubmit = () => {
		if (startingPoint.trim() && endingPoint.trim()) {
			onStartRide(startingPoint, endingPoint);
		}
	};

	const handleUseCurrentLocation = async () => {
		setApplyCurrentLocation(true);
		await getCurrentLocation();
	};

	const handleSelectStartingSuggestion = (value: string) => {
		setSkipStartingLookup(true);
		setStartingPoint(value);
		setStartingSuggestions([]);
	};

	const handleSelectEndingSuggestion = (value: string) => {
		setSkipEndingLookup(true);
		setEndingPoint(value);
		setEndingSuggestions([]);
	};

	const isValid = startingPoint.trim() && endingPoint.trim();

	const styles = StyleSheet.create({
		container: {
			flex: 1,
			backgroundColor: colors.background,
		},
		content: {
			paddingHorizontal: metrics.md,
			paddingTop: metrics.md,
			paddingBottom: metrics.lg,
		},
		label: {
			fontSize: typography.sizes.sm,
			fontWeight: typography.weights.medium as any,
			color: colors.textPrimary,
			marginBottom: 6,
		},
		labelRow: {
			flexDirection: 'row',
			alignItems: 'center',
			justifyContent: 'space-between',
		},
		locationAction: {
			color: colors.primary,
			fontSize: typography.sizes.xs,
			fontWeight: typography.weights.medium as any,
		},
		input: {
			height: 54,
			paddingHorizontal: metrics.md,
			borderRadius: 12,
			backgroundColor: colors.surfaceMuted,
			color: colors.textPrimary,
			fontSize: typography.sizes.base,
			borderWidth: 0,
		},
		suggestionWrap: {
			marginTop: 8,
			borderRadius: 12,
			borderWidth: 1,
			borderColor: colors.border,
			backgroundColor: colors.surface,
			overflow: 'hidden',
		},
		suggestionRow: {
			paddingHorizontal: metrics.md,
			paddingVertical: 11,
			borderBottomWidth: 1,
			borderBottomColor: colors.border,
		},
		suggestionText: {
			color: colors.textPrimary,
			fontSize: typography.sizes.sm,
		},
		loadingRow: {
			paddingVertical: 10,
			alignItems: 'center',
		},
		submitButton: {
			height: 56,
			borderRadius: 14,
			backgroundColor: colors.primary,
			alignItems: 'center',
			justifyContent: 'center',
			marginTop: 24,
			opacity: isValid ? 1 : 0.6,
		},
		submitButtonText: {
			fontSize: typography.sizes.base,
			fontWeight: typography.weights.bold as any,
			color: colors.white,
		},
		disabledButton: {
			opacity: 0.6,
		},
	});

	return (
		<ScrollView
			style={styles.container}
			contentContainerStyle={styles.content}
			showsVerticalScrollIndicator={false}
		>
			<View>
				<View style={styles.labelRow}>
					<Text style={styles.label}>Starting point</Text>
					<Pressable
						onPress={() => {
							void handleUseCurrentLocation();
						}}
						disabled={isLoading || isLocationLoading}
					>
						<Text style={styles.locationAction}>
							{isLocationLoading ? 'Fetching location...' : 'Use current location'}
						</Text>
					</Pressable>
				</View>
				<TextInput
					style={styles.input}
					placeholder="Enter Starting Point"
					placeholderTextColor={colors.textTertiary}
					value={startingPoint}
					onChangeText={(value) => {
						setStartingPoint(value);
						if (value.trim().length < 3) {
							setStartingSuggestions([]);
						}
					}}
					editable={!isLoading}
				/>
				{isStartingSuggestionsLoading ? (
					<View style={styles.loadingRow}>
						<ActivityIndicator color={colors.primary} size="small" />
					</View>
				) : null}
				{startingSuggestions.length > 0 ? (
					<View style={styles.suggestionWrap}>
						{startingSuggestions.map((item, index) => (
							<Pressable
								key={`${item}-${index}`}
								onPress={() => handleSelectStartingSuggestion(item)}
								style={styles.suggestionRow}
							>
								<Text style={styles.suggestionText}>{item}</Text>
							</Pressable>
						))}
					</View>
				) : null}
			</View>

			<View style={{ marginTop: 18 }}>
				<Text style={styles.label}>Ending point</Text>
				<TextInput
					style={styles.input}
					placeholder="Enter Ending Point"
					placeholderTextColor={colors.textTertiary}
					value={endingPoint}
					onChangeText={(value) => {
						setEndingPoint(value);
						if (value.trim().length < 3) {
							setEndingSuggestions([]);
						}
					}}
					editable={!isLoading}
				/>
				{isEndingSuggestionsLoading ? (
					<View style={styles.loadingRow}>
						<ActivityIndicator color={colors.primary} size="small" />
					</View>
				) : null}
				{endingSuggestions.length > 0 ? (
					<View style={styles.suggestionWrap}>
						{endingSuggestions.map((item, index) => (
							<Pressable
								key={`${item}-${index}`}
								onPress={() => handleSelectEndingSuggestion(item)}
								style={styles.suggestionRow}
							>
								<Text style={styles.suggestionText}>{item}</Text>
							</Pressable>
						))}
					</View>
				) : null}
			</View>

			<Pressable
				style={[styles.submitButton, !isValid && styles.disabledButton]}
				onPress={handleSubmit}
				disabled={!isValid || isLoading}
				hitSlop={8}
			>
				{isLoading ? (
					<ActivityIndicator color={colors.white} />
				) : (
					<Text style={styles.submitButtonText}>Start Ride</Text>
				)}
			</Pressable>
		</ScrollView>
	);
}
