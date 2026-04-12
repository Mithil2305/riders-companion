import { FeedPostItem, Story } from '../../types/feed';

export const mockStories: Story[] = [
  { id: '1', name: 'You', isAdd: true },
  { id: '2', name: 'Alex', avatar: 'https://i.pravatar.cc/150?img=11' },
  { id: '3', name: 'John', avatar: 'https://i.pravatar.cc/150?img=12' },
  { id: '4', name: 'Riya', avatar: 'https://i.pravatar.cc/150?img=13' },
  { id: '5', name: 'Kiran', avatar: 'https://i.pravatar.cc/150?img=14' },
];

export const mockPosts: FeedPostItem[] = [
  {
    id: '1',
    user: 'alex_rider',
    avatar: 'https://i.pravatar.cc/150?img=1',
    image: 'https://picsum.photos/seed/riderx/1200/900',
    caption: 'Amazing ride through the mountains today! #RiderLife',
    likes: 142,
    comments: 23,
    time: '2h',
  },
  {
    id: '2',
    user: 'moto_john',
    avatar: 'https://i.pravatar.cc/150?img=2',
    image: 'https://picsum.photos/seed/motojohn/1200/900',
    caption: 'Sunset ride with my bike 🌄 #MotoLife',
    likes: 120,
    comments: 18,
    time: '5h',
  },
  {
    id: '3',
    user: 'sarah_moto',
    avatar: 'https://i.pravatar.cc/150?img=3',
    image: 'https://picsum.photos/seed/addas/1200/900',
    caption: 'Road therapy with the crew. #WeekendRide #OpenRoad',
    likes: 96,
    comments: 11,
    time: '1d',
  },
];
