import React from 'react';
import {
	ActivityIndicator,
	Pressable,
	ScrollView,
	StyleSheet,
	Text,
} from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import {
	RideLocationPicker,
	type RideLocationValue,
} from '../map/RideLocationPicker';

interface LocationStepProps {
	label: string;
	actionLabel: string;
	value: RideLocationValue | null;
	onChange: (location: RideLocationValue) => void;
	onSubmit: (location: RideLocationValue) => void;
	isLoading?: boolean;
	showCurrentLocationAction?: boolean;
}

export function LocationStep({
	label,
	actionLabel,
	value,
	onChange,
	onSubmit,
	isLoading = false,
	showCurrentLocationAction = false,
}: LocationStepProps) {
	const { colors, typography, metrics } = useTheme();

	const isValid = Boolean(value?.placeName.trim());

	const handleSubmit = () => {
		if (value?.placeName.trim()) {
			onSubmit(value);
		}
	};

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
			<RideLocationPicker
				label={label}
				value={value}
				onChange={onChange}
				showCurrentLocationAction={showCurrentLocationAction}
			/>

			<Pressable
				style={[styles.submitButton, !isValid && styles.disabledButton]}
				onPress={handleSubmit}
				disabled={!isValid || isLoading}
				hitSlop={8}
			>
				{isLoading ? (
					<ActivityIndicator color={colors.white} />
				) : (
					<Text style={styles.submitButtonText}>{actionLabel}</Text>
				)}
			</Pressable>
		</ScrollView>
	);
}
