export type StatusRingType = 'none' | 'new' | 'viewed' | 'muted';

export interface StatusEntry {
  id: string;
  name: string;
  time: string;
  avatar: string;
  ringType: StatusRingType;
}
