import React from 'react';
import { LocationStep } from './LocationStep';
import type { RideLocationValue } from '../map/RideLocationPicker';

type SoloRideStep = 'starting' | 'ending';

interface SoloRideFormProps {
  step: SoloRideStep;
  startingLocation: RideLocationValue | null;
  endingLocation: RideLocationValue | null;
  onChangeStartingLocation: (location: RideLocationValue) => void;
  onChangeEndingLocation: (location: RideLocationValue) => void;
  onNext: (location: RideLocationValue) => void;
  onSubmit: (location: RideLocationValue) => void;
  isLoading?: boolean;
}

export function SoloRideForm({
  step,
  startingLocation,
  endingLocation,
  onChangeStartingLocation,
  onChangeEndingLocation,
  onNext,
  onSubmit,
  isLoading = false,
}: SoloRideFormProps) {
  if (step === 'starting') {
    return (
      <LocationStep
        label="Starting Point"
        actionLabel="Next"
        value={startingLocation}
        onChange={onChangeStartingLocation}
        onSubmit={onNext}
        isLoading={isLoading}
        showCurrentLocationAction
      />
    );
  }

  return (
    <LocationStep
      label="Ending Point"
      actionLabel="Start Ride"
      value={endingLocation}
      onChange={onChangeEndingLocation}
      onSubmit={onSubmit}
      isLoading={isLoading}
    />
  );
}
