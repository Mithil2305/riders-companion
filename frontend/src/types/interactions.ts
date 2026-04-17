export interface PostCardUser {
  id: string;
  username: string;
  avatarUrl: string;
  location: string;
  timeLabel: string;
}

export interface PostCardImage {
  uri: string;
}

export interface PostCardCaption {
  username: string;
  text: string;
}

export interface PostCardStats {
  likeCount: number;
  commentCount: number;
  isLiked?: boolean;
  isBookmarked?: boolean;
}

export interface PostCardModel {
  id: string;
  user: PostCardUser;
  image: PostCardImage;
  caption: PostCardCaption;
  stats: PostCardStats;
}

export interface CommentAuthor {
  id: string;
  username: string;
  avatarUrl: string;
}

export interface CommentModel {
  id: string;
  postId: string;
  author: CommentAuthor;
  content: string;
  timeLabel: string;
  likeCount: number;
  likedByMe: boolean;
}

export interface CreateCommentInput {
  postId: string;
  content: string;
}

export interface ShareUser {
  id: string;
  name: string;
  username: string;
  avatarUrl: string;
}

export type ShareTargetType = 'user' | 'story' | 'message' | 'link' | 'facebook' | 'twitter' | 'whatsapp';

export interface SharePostInput {
  postId: string;
  targetType: ShareTargetType;
  targetId?: string;
}

export interface ShareActionModel {
  id: ShareTargetType;
  label: string;
  iconName: string;
}
