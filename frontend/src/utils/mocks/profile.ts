import { Badge, GarageBike, ProfileUser } from '../../types/profile';

export const mockProfileUser: ProfileUser = {
  name: 'Mohan',
  username: '@riderX',
  bio: 'Ride hard, ride safe 🔥',
  miles: 1240,
  avgSpeed: 62,
  rides: 48,
  avatar: 'https://i.pravatar.cc/300?img=14',
  coverImage: 'https://picsum.photos/seed/rider-cover/1200/700',
};

export const mockBadges: Badge[] = [
  { id: '1', title: '1000 Miles', unlocked: true },
  { id: '2', title: 'Speedster', unlocked: true },
  { id: '3', title: 'Night Hawk', unlocked: false },
  { id: '4', title: 'Road Captain', unlocked: false },
  { id: '5', title: 'Safe Rider', unlocked: true },
  { id: '6', title: 'Early Climber', unlocked: false },
];

export const mockGarageBikes: GarageBike[] = [
  {
    id: '1',
    brand: 'Yamaha',
    model: 'R15',
    year: 2022,
    image: 'https://picsum.photos/seed/bike-r15/320/220',
  },
  {
    id: '2',
    brand: 'Honda',
    model: 'CB350',
    year: 2021,
    image: 'https://picsum.photos/seed/bike-cb350/320/220',
  },
];
