import type { CommunityData } from '../../types/community';

export const communityMockData: CommunityData = {
  activeRide: {
    id: 'active-1',
    badge: 'LIVE',
    title: 'Chennai -> Pondicherry',
    subtitle: 'Coastline Run • 165 KM',
    actionIcon: 'navigate',
    avatars: [
      { id: 'a1', name: 'AK' },
      { id: 'a2', name: 'SK' },
      { id: 'a3', name: 'VK' },
    ],
    extraCount: 12,
  },
  suggestedGroups: [
    {
      id: 'sg-1',
      title: 'Thunderbirds Chennai',
      badge: 'FRIENDS ONLY',
      duration: '3 Days',
      riders: '42 Riders',
      image: require('../../../assets/images/group_ride.png'),
    },
    {
      id: 'sg-2',
      title: 'Weekend Warriors',
      badge: 'STREET',
      duration: '2 Days',
      riders: '28 Riders',
      image: require('../../../assets/images/hero.png'),
    },
  ],
  nearbyRides: [
    {
      id: 'nr-1',
      route: 'Chennai -> Yercaud',
      levelTag: 'PRO',
      pricePerDay: '₹850',
      startsAt: 'Starts: Dec 12, 05:00 AM',
      tags: [
        { id: 't1', label: 'Food Included', icon: 'restaurant' },
        { id: 't2', label: 'Hotel Included', icon: 'bed' },
      ],
      joinedText: '14 / 20 Joined',
    },
    {
      id: 'nr-2',
      route: 'Chennai -> Mahabalipuram',
      pricePerDay: '₹200',
      startsAt: 'Starts: Dec 15, 06:30 AM',
      tags: [{ id: 't3', label: 'Breakfast Ride', icon: 'cafe' }],
      joinedText: '5 / 10 Joined',
    },
  ],
  myRides: [
    {
      id: 'mr-1',
      route: 'Chennai Coast Run',
      startsAt: 'Today • 06:00 AM',
      tags: [
        { id: 't4', label: 'Food Included', icon: 'restaurant' },
        { id: 't5', label: 'Hotel Included', icon: 'bed' },
      ],
      joinedText: '14 / 20 Joined',
      status: 'active',
      statusLabel: 'Active',
    },
    {
      id: 'mr-2',
      route: 'Bangalore Breakfast Club',
      startsAt: 'Completed • Oct 24',
      tags: [{ id: 't6', label: 'Breakfast Ride', icon: 'cafe' }],
      joinedText: '5 / 10 Joined',
      status: 'completed',
      statusLabel: 'ENDED',
    },
  ],
};
