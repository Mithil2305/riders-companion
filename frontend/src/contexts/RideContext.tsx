import React, { createContext, useContext, useState, ReactNode } from 'react';

interface RideContextType {
  currentRide: any;
  isRiding: boolean;
  startRide: () => void;
  endRide: () => void;
  updateLocation: (location: any) => void;
}

const RideContext = createContext<RideContextType | undefined>(undefined);

export function RideProvider({ children }: { children: ReactNode }) {
  const [currentRide, setCurrentRide] = useState<any>(null);
  const [isRiding, setIsRiding] = useState(false);

  const startRide = () => {
    setIsRiding(true);
    setCurrentRide({ startTime: new Date() });
  };

  const endRide = () => {
    setIsRiding(false);
    setCurrentRide(null);
  };

  const updateLocation = (location: any) => {
    // TODO: Implement location update logic
    console.log('Location updated:', location);
  };

  return (
    <RideContext.Provider value={{ currentRide, isRiding, startRide, endRide, updateLocation }}>
      {children}
    </RideContext.Provider>
  );
}

export function useRide() {
  const context = useContext(RideContext);
  if (context === undefined) {
    throw new Error('useRide must be used within a RideProvider');
  }
  return context;
}
