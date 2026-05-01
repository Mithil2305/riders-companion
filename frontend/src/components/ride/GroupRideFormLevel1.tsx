import React from 'react';
import { LocationStep } from './LocationStep';
import type { RideLocationValue } from '../map/RideLocationPicker';

interface GroupRideFormLevel1Props {
	startingLocation: RideLocationValue | null;
	onChangeStartingLocation: (location: RideLocationValue) => void;
	onProceed: (location: RideLocationValue) => void;
	isLoading?: boolean;
}

export function GroupRideFormLevel1({
	startingLocation,
	onChangeStartingLocation,
	onProceed,
	isLoading = false,
}: GroupRideFormLevel1Props) {
	return (
		<LocationStep
			label="Starting Point"
			actionLabel="Next"
			value={startingLocation}
			onChange={onChangeStartingLocation}
			onSubmit={onProceed}
			isLoading={isLoading}
			showCurrentLocationAction
		/>
	);
}
