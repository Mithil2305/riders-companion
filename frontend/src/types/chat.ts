export type ChatFilter = 'all' | 'personal' | 'group' | 'ended' | 'blocked';

export type ChatRoomType = 'personal' | 'group';
export type ChatStatus = 'active' | 'ended' | 'blocked';
export type MessageSender = 'me' | 'other';
export type MessageDelivery = 'sent' | 'delivered' | 'read' | 'failed';
export type RideInviteStatus = 'pending' | 'joined' | 'rejected';

export interface RideInviteRouteInfo {
  rideTitle?: string;
  source?: string;
  destination?: string;
  startDate?: string;
  endDate?: string;
  days?: number;
  budget?: number;
  ridePace?: 'calm' | 'balanced' | 'fast';
  roadPreference?: 'scenic' | 'highway' | 'mixed';
  meetupNotes?: string;
}

export interface RideInvitePayload extends RideInviteRouteInfo {
  type: 'ride-invite';
  inviteId: string;
  rideId: string;
  roomName: string;
  inviterId: string;
  inviterName: string;
  status: RideInviteStatus;
  sentAt: string;
  respondedBy?: string;
}

export interface SharedContentPayload {
  type: 'shared-content';
  resourceType: 'post' | 'clip';
  resourceId: string;
  title?: string;
  caption?: string;
  thumbnailUrl?: string;
  senderId: string;
  senderName: string;
  sentAt: string;
}

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

export interface PersonalInviteMessage extends PersonalMessageBase {
  kind: 'invite';
  invite: RideInvitePayload;
}

export interface PersonalSharedMessage extends PersonalMessageBase {
  kind: 'shared-content';
  shared: SharedContentPayload;
}

export type PersonalChatMessage =
  | PersonalTextMessage
  | PersonalImageMessage
  | PersonalInviteMessage
  | PersonalSharedMessage;
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
