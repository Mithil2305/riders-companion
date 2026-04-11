import { TrackerUser } from '../../types/profile';

export const mockFollowers: TrackerUser[] = [
  {
    id: '1',
    name: 'Alex',
    avatar: 'https://i.pravatar.cc/150?img=10',
    isFollowing: true,
  },
  {
    id: '2',
    name: 'John',
    avatar: 'https://i.pravatar.cc/150?img=21',
    isFollowing: false,
  },
];

export const mockFollowing: TrackerUser[] = [
  {
    id: '3',
    name: 'SpeedKing',
    avatar: 'https://i.pravatar.cc/150?img=22',
    isFollowing: true,
  },
];
