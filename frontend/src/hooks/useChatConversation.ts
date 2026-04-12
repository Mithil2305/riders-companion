import React from 'react';
import { ChatMessage } from '../types/chat';

const AVATARS_BY_ROOM: Record<string, string> = {
  '1': 'https://i.pravatar.cc/120?img=33',
  '2': 'https://i.pravatar.cc/120?img=5',
  '3': 'https://i.pravatar.cc/120?img=12',
  '4': 'https://i.pravatar.cc/120?img=29',
  '5': 'https://i.pravatar.cc/120?img=45',
};

const NAMES_BY_ROOM: Record<string, string> = {
  '1': 'Cameron Williamson',
  '2': 'Annette Black',
  '3': 'Marvin McKinney',
  '4': 'Brooklyn Simmons',
  '5': 'Devon Lane',
};

function createInitialMessages(roomId: string): ChatMessage[] {
  return [
    {
      id: `in-${roomId}-1`,
      sender: 'other',
      text: 'Hey! How are you?',
      avatar: AVATARS_BY_ROOM[roomId] ?? AVATARS_BY_ROOM['1'],
    },
    {
      id: `out-${roomId}-1`,
      sender: 'me',
      text: 'All good! Working on the project 🚀',
      reaction: '❤️',
    },
  ];
}

export function useChatConversation(roomId: string) {
  const [messages, setMessages] = React.useState<ChatMessage[]>(() => createInitialMessages(roomId));
  const [draft, setDraft] = React.useState('');
  const [showTyping, setShowTyping] = React.useState(false);

  React.useEffect(() => {
    setMessages(createInitialMessages(roomId));
    setDraft('');
  }, [roomId]);

  const sendMessage = React.useCallback(() => {
    const trimmed = draft.trim();

    if (!trimmed) {
      return;
    }

    const nextMessage: ChatMessage = {
      id: `out-${Date.now()}`,
      sender: 'me',
      text: trimmed,
      isNew: true,
    };

    setMessages((prev) => [...prev, nextMessage]);
    setDraft('');
    setShowTyping(true);

    setTimeout(() => {
      setShowTyping(false);
    }, 1800);
  }, [draft]);

  return {
    chatName: NAMES_BY_ROOM[roomId] ?? 'Ride Buddy',
    chatAvatar: AVATARS_BY_ROOM[roomId] ?? AVATARS_BY_ROOM['1'],
    messages,
    draft,
    setDraft,
    sendMessage,
    showTyping,
  };
}