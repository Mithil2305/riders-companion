import React, { createContext, useContext, useState, ReactNode } from "react";

export interface RideParticipant {
	riderId: string;
	name: string;
	username?: string | null;
	participantStatus: string;
	isLeader: boolean;
	isOnline?: boolean;
	avatar?: string | null;
}

export interface RideLocation {
	rideId: string;
	riderId: string;
	name: string;
	username?: string | null;
	avatar?: string | null;
	latitude: number;
	longitude: number;
	deviceSpeedKmh?: number | null;
	speed: number | null;
	heading: number | null;
	accuracy: number | null;
	altitude: number | null;
	timestamp?: string;
	updatedAt: string;
}

export interface RideRoute {
	source: string | null;
	destination: string | null;
	sourceCoordinates: { latitude: number; longitude: number } | null;
	destinationCoordinates: { latitude: number; longitude: number } | null;
	routePolyline: Array<{ latitude: number; longitude: number }>;
}

export interface RideSnapshot {
	rideId: string;
	rideStatus: string;
	leaderRiderId: string | null;
	route: RideRoute;
	participants: RideParticipant[];
	locations: RideLocation[];
	snapshotAt: string;
}

export interface CurrentRide {
	id: string;
	status: string;
	details: {
		source?: string;
		destination?: string;
		startDate?: string;
		endDate?: string | null;
		days?: number;
	};
	snapshot?: RideSnapshot;
	startTime: number;
}

interface RideContextType {
	currentRide: CurrentRide | null;
	isRiding: boolean;
	rideLocations: RideLocation[];
	setCurrentRide: (ride: CurrentRide | null) => void;
	setRideLocations: (locations: RideLocation[]) => void;
	updateRideSnapshot: (snapshot: RideSnapshot) => void;
	clearRide: () => void;
}

const RideContext = createContext<RideContextType | undefined>(undefined);

export function RideProvider({ children }: { children: ReactNode }) {
	const [currentRide, setCurrentRide] = useState<CurrentRide | null>(null);
	const [rideLocations, setRideLocations] = useState<RideLocation[]>([]);

	const isRiding =
		currentRide !== null &&
		String(currentRide.status).toUpperCase() === "ACTIVE";

	const updateRideSnapshot = React.useCallback((snapshot: RideSnapshot) => {
		setCurrentRide((prev) => {
			if (!prev) return null;
			return {
				...prev,
				snapshot,
			};
		});
		setRideLocations(snapshot.locations);
	}, []);

	const clearRide = React.useCallback(() => {
		setCurrentRide(null);
		setRideLocations([]);
	}, []);

	return (
		<RideContext.Provider
			value={{
				currentRide,
				isRiding,
				rideLocations,
				setCurrentRide,
				setRideLocations,
				updateRideSnapshot,
				clearRide,
			}}
		>
			{children}
		</RideContext.Provider>
	);
}

export function useRide() {
	const context = useContext(RideContext);
	if (context === undefined) {
		throw new Error("useRide must be used within a RideProvider");
	}
	return context;
}
