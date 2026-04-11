export interface Story {
  id: string;
  name: string;
  avatar?: string;
  isAdd?: boolean;
}

export interface FeedPostItem {
  id: string;
  user: string;
  avatar: string;
  image: string;
  caption: string;
  likes: number;
  time: string;
}
