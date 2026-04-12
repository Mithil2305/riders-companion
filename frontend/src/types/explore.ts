export interface SuggestedUser {
  id: string;
  name: string;
  avatar: string;
}

export interface SuggestedRoom {
  id: string;
  name: string;
  members: number;
}

export interface TrendingClip {
  id: string;
  title: string;
  thumbnail: string;
}

export interface ExploreGridSection {
  id: string;
  layout: 'large-small-large' | 'small-large-small';
  heroTop: TrendingClip;
  smallLeft: TrendingClip;
  smallRight: TrendingClip;
  heroBottom?: TrendingClip;
}
