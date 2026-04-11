import { SuggestedRoom, SuggestedUser, TrendingClip } from '../../types/explore';

export const mockSuggestedUsers: SuggestedUser[] = [
  { id: '1', name: 'RiderX', avatar: 'https://i.pravatar.cc/150?img=21' },
  { id: '2', name: 'SpeedKing', avatar: 'https://i.pravatar.cc/150?img=22' },
  { id: '3', name: 'Alex', avatar: 'https://i.pravatar.cc/150?img=23' },
  { id: '4', name: 'Cameron', avatar: 'https://i.pravatar.cc/150?img=24' },
];

export const mockSuggestedRooms: SuggestedRoom[] = [
  { id: '1', name: 'Chennai Riders', members: 120 },
  { id: '2', name: 'Night Riders', members: 80 },
  { id: '3', name: 'Mountain Pulse', members: 64 },
];

export const mockTrendingClips: TrendingClip[] = [
  {
    id: '1',
    title: 'Wheelie 🔥',
    thumbnail: 'https://picsum.photos/seed/clip1/640/640',
  },
  {
    id: '2',
    title: 'Track Day',
    thumbnail: 'https://picsum.photos/seed/clip2/640/640',
  },
  {
    id: '3',
    title: 'Night Run',
    thumbnail: 'https://picsum.photos/seed/clip3/640/640',
  },
  {
    id: '4',
    title: 'Hill Climb',
    thumbnail: 'https://picsum.photos/seed/clip4/640/640',
  },
];
