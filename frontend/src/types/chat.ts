export type ChatFilter = 'all' | 'personal' | 'group' | 'ended' | 'blocked';

export type ChatRoomType = 'personal' | 'group';
export type ChatStatus = 'active' | 'ended' | 'blocked';
export type MessageSender = 'me' | 'other';
export type MessageDelivery = 'sent' | 'delivered' | 'read' | 'failed';

export interface ChatPreview {
  id: string;
  name: string;
  username?: string;
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

export type PersonalChatMenuAction = 'toggle-block-user';

export interface PersonalChatMeta {
  roomId: string;
  name: string;
  username?: string | null;
  avatar: string | null;
  isOnline: boolean;
  rideTogetherLabel: string;
  blockedByViewer?: boolean;
  blockedByOther?: boolean;
  isBlocked?: boolean;
  isSelf?: boolean;
}

export interface ChatMessage {
  id: string;
  sender: 'me' | 'other';
  text: string;
  avatar?: string;
  reaction?: string;
  isNew?: boolean;
}
