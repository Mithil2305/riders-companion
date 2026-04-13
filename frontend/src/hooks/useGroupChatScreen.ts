import React from 'react';
import { GroupChatItem } from '../types/groupChat';

const INITIAL_CHAT: GroupChatItem[] = [
  {
    id: '1',
    kind: 'system',
    text: 'JOHN STARTED THE RIDE',
  },
  {
    id: '2',
    kind: 'incoming',
    senderName: 'SARAH',
    message: "Checkpoints look good. I'm hitting the highway now. Everyone ready?",
    avatar: 'https://randomuser.me/api/portraits/women/65.jpg',
    time: '08:42 AM',
  },
  {
    id: '3',
    kind: 'incoming-location',
    senderName: 'ARUN',
    message: "I'm taking a quick break near Vellore. Catching up in 10!",
    avatar: 'https://randomuser.me/api/portraits/men/39.jpg',
    time: '08:45 AM',
    locationLabel: 'Vellore Bypass',
  },
  {
    id: '4',
    kind: 'outgoing',
    message: 'Copy that, Arun. We are about 15 mins behind you. Keeping a steady 80kmph.',
    time: '08:47 AM',
  },
  {
    id: '5',
    kind: 'incoming',
    senderName: 'SARAH',
    message: "Found a great breakfast spot at the next toll. Let's regroup there!",
    avatar: 'https://randomuser.me/api/portraits/women/65.jpg',
    time: '08:50 AM',
  },
];

export const INVITE_FRIENDS = [
  'Cameron Williamson',
  'Annette Black',
  'Marvin McKinney',
  'Brooklyn Simmons',
];

export function useGroupChatScreen() {
  const [menuVisible, setMenuVisible] = React.useState(false);
  const [inviteVisible, setInviteVisible] = React.useState(false);
  const [locationEnabled, setLocationEnabled] = React.useState(true);
  const [isAdmin] = React.useState(true);
  const [draft, setDraft] = React.useState('');
  const [messages, setMessages] = React.useState<GroupChatItem[]>(INITIAL_CHAT);

  const closeMenu = React.useCallback(() => setMenuVisible(false), []);
  const openMenu = React.useCallback(() => setMenuVisible(true), []);
  const openInvite = React.useCallback(() => setInviteVisible(true), []);
  const closeInvite = React.useCallback(() => setInviteVisible(false), []);

  const sendMessage = React.useCallback(() => {
    const trimmed = draft.trim();
    if (!trimmed) {
      return;
    }

    const now = new Date();
    const hour = `${now.getHours()}`.padStart(2, '0');
    const minute = `${now.getMinutes()}`.padStart(2, '0');

    setMessages((prev) => [
      ...prev,
      {
        id: `out-${Date.now()}`,
        kind: 'outgoing',
        message: trimmed,
        time: `${hour}:${minute}`,
      },
    ]);
    setDraft('');
  }, [draft]);

  const inviteFromMenu = React.useCallback(() => {
    closeMenu();
    openInvite();
  }, [closeMenu, openInvite]);

  return {
    menuVisible,
    inviteVisible,
    locationEnabled,
    isAdmin,
    draft,
    messages,
    setDraft,
    setLocationEnabled,
    openMenu,
    closeMenu,
    openInvite,
    closeInvite,
    inviteFromMenu,
    sendMessage,
  };
}
