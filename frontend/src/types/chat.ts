export type ChatFilter = 'all' | 'personal' | 'group' | 'ended';

export type ChatRoomType = 'personal' | 'group';
export type ChatStatus = 'active' | 'ended';
export type MessageSender = 'me' | 'other';
export type MessageDelivery = 'sent' | 'delivered' | 'read';

export interface ChatPreview {
  id: string;
  name: string;
  message: string;
  time: string;
  avatar: string;
  roomType: ChatRoomType;
  status?: ChatStatus;
  senderName?: string;
  unreadCount?: number;
  isOnline?: boolean;
}

export interface DateSeparatorItem {
  id: string;
  kind: 'date-separator';
  label: string;
}

interface PersonalMessageBase {
  id: string;
  sender: MessageSender;
  createdAt: string;
  timeLabel: string;
  delivery?: MessageDelivery;
  reaction?: string;
  avatar?: string;
  isNew?: boolean;
}

export interface PersonalTextMessage extends PersonalMessageBase {
  kind: 'text';
  text: string;
}

export interface PersonalImageMessage extends PersonalMessageBase {
  kind: 'image';
  imageUrl: string;
  text?: string;
}

export type PersonalChatMessage = PersonalTextMessage | PersonalImageMessage;
export type PersonalChatListItem = DateSeparatorItem | PersonalChatMessage;

export type PersonalChatMenuAction =
  | 'voice-call'
  | 'video-call'
  | 'clear-chat'
  | 'mute-notifications'
  | 'block-user';

export interface PersonalChatMeta {
  roomId: string;
  name: string;
  avatar: string;
  isOnline: boolean;
  rideTogetherLabel: string;
}

export interface ChatMessage {
  id: string;
  sender: 'me' | 'other';
  text: string;
  avatar?: string;
  reaction?: string;
  isNew?: boolean;
}