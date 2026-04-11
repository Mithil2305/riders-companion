import React from 'react';
import { Badge, GarageBike, ProfileUser } from '../types/profile';
import { mockBadges, mockGarageBikes, mockProfileUser } from '../utils/mocks/profile';

interface UseProfileDashboardDataResult {
  loading: boolean;
  user: ProfileUser;
  badges: Badge[];
  bikes: GarageBike[];
}

export function useProfileDashboardData(): UseProfileDashboardDataResult {
  const [loading, setLoading] = React.useState(true);
  const [user] = React.useState<ProfileUser>(mockProfileUser);
  const [badges] = React.useState<Badge[]>(mockBadges);
  const [bikes] = React.useState<GarageBike[]>(mockGarageBikes);

  React.useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  return {
    loading,
    user,
    badges,
    bikes,
  };
}
