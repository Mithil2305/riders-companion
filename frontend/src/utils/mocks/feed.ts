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
    user: 'RiderX',
    avatar: 'https://i.pravatar.cc/150?img=1',
    image: 'https://picsum.photos/seed/riderx/1200/900',
    caption: 'Morning ride 🔥 Great weather and empty roads.',
    likes: 120,
    time: '2h ago',
  },
  {
    id: '2',
    user: 'moto_john',
    avatar: 'https://i.pravatar.cc/150?img=2',
    image: 'https://picsum.photos/seed/motojohn/1200/900',
    caption: 'Sunset cruise with the crew. #MotoLife',
    likes: 98,
    time: '5h ago',
  },
  {
    id: '3',
    user: 'addas_ride',
    avatar: 'https://i.pravatar.cc/150?img=3',
    image: 'https://picsum.photos/seed/addas/1200/900',
    caption: 'Weekend twisties. Pure therapy.',
    likes: 142,
    time: '1d ago',
  },
];
