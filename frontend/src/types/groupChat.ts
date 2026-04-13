export type GroupChatItem =
  | {
      id: string;
      kind: 'system';
      text: string;
    }
  | {
      id: string;
      kind: 'incoming';
      senderName: string;
      message: string;
      avatar: string;
      time: string;
    }
  | {
      id: string;
      kind: 'incoming-location';
      senderName: string;
      message: string;
      avatar: string;
      time: string;
      locationLabel: string;
    }
  | {
      id: string;
      kind: 'outgoing';
      message: string;
      time: string;
    };
