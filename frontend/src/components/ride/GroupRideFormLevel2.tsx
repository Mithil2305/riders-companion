import React from 'react';
import { LocationStep } from './LocationStep';
import type { RideLocationValue } from '../map/RideLocationPicker';

interface GroupRideFormLevel2Props {
	endingLocation: RideLocationValue | null;
	onChangeEndingLocation: (location: RideLocationValue) => void;
	onProceed: (location: RideLocationValue) => void;
	isLoading?: boolean;
}

export function GroupRideFormLevel2({
	endingLocation,
	onChangeEndingLocation,
	onProceed,
	isLoading = false,
}: GroupRideFormLevel2Props) {
	return (
		<LocationStep
			label="Ending Point"
			actionLabel="Next"
			value={endingLocation}
			onChange={onChangeEndingLocation}
			onSubmit={onProceed}
			isLoading={isLoading}
		/>
	);
}
