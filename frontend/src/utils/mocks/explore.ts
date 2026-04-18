import { PostCardModel } from '../../types/interactions';
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

const explorePostSeeds = [
  'Dawn canyon sprint',
  'City lane split',
  'Track apex practice',
  'Weekend highway push',
  'Helmet cam rain ride',
  'Tunnel rev check',
  'Midnight fuel stop',
  'Mountain switchbacks',
  'Solo commute run',
  'New tires first ride',
  'Group ride meetup',
  'Street cafe pit stop',
  'Ridge line cruise',
  'Sharp turn warmup',
  'Fast lane night ride',
  'Open road horizon',
  'Sunday service check',
  'Wheel control drill',
  'Bridge crossing reel',
  'Backroad sunset line',
  'Touring setup check',
  'City traffic escapes',
  'Helmet reflection shot',
  'Throttle control tips',
];

export const mockExplorePosts: PostCardModel[] = explorePostSeeds.map((title, index) => {
  const id = String(index + 1);

  return {
    id,
    user: {
      id: `rider-${id}`,
      username: `rider_${id}`,
      avatarUrl: `https://i.pravatar.cc/300?img=${(index % 60) + 1}`,
      location: ['Chennai', 'Bengaluru', 'Hyderabad', 'Mumbai'][index % 4],
      timeLabel: `${(index % 9) + 1}h`,
    },
    image: {
      uri: `https://picsum.photos/seed/explore-rider-${id}/1200/1200`,
    },
    caption: {
      username: `rider_${id}`,
      text: `${title}. Rolling with the crew and keeping lines smooth.`,
    },
    stats: {
      likeCount: 80 + index * 7,
      commentCount: 6 + (index % 12),
      isLiked: false,
    },
  };
});

export const mockTrendingClips: TrendingClip[] = mockExplorePosts.map((post) => ({
  id: post.id,
  title: post.caption.text,
  thumbnail: post.image.uri,
}));
