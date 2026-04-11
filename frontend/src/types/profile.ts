export interface ProfileUser {
  name: string;
  username: string;
  bio: string;
  miles: number;
  avgSpeed: number;
  rides: number;
  avatar: string;
  coverImage: string;
}

export interface Badge {
  id: string;
  title: string;
  unlocked: boolean;
}

export interface GarageBike {
  id: string;
  brand: string;
  model: string;
  year: number;
  image: string;
}

export interface TrackerUser {
  id: string;
  name: string;
  avatar: string;
  isFollowing: boolean;
}
