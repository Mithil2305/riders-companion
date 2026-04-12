export type ChatFilter = 'mutual' | 'new' | 'group';

export interface ChatPreview {
  id: string;
  name: string;
  message: string;
  time: string;
  avatar: string;
  unreadCount?: number;
  hasUnreadDot?: boolean;
  category: ChatFilter;
}

export interface ChatMessage {
  id: string;
  sender: 'me' | 'other';
  text: string;
  avatar?: string;
  reaction?: string;
  isNew?: boolean;
}