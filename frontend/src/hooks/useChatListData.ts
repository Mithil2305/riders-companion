import React from 'react';
import { ChatFilter, ChatPreview } from '../types/chat';

const CHAT_PREVIEWS: ChatPreview[] = [
  {
    id: '1',
    name: 'Arun Kumar',
    message: 'Heading out for the weekend?',
    time: '10:45 AM',
    avatar: 'https://i.pravatar.cc/120?img=68',
    roomType: 'personal',
    unreadCount: 2,
    isOnline: true,
  },
  {
    id: '2',
    name: 'Chennai Riders',
    senderName: 'Sarah',
    message: 'Checkpoints look good',
    time: '09:30 AM',
    avatar: 'https://i.pravatar.cc/120?img=9',
    roomType: 'group',
    status: 'active',
  },
  {
    id: '3',
    name: 'Mountain Loop',
    message: 'Ride completed successfully',
    time: '2D AGO',
    avatar: 'https://i.pravatar.cc/120?img=56',
    roomType: 'group',
    status: 'ended',
  },
];

export function useChatListData() {
  const [searchQuery, setSearchQuery] = React.useState('');
  const [activeFilter, setActiveFilter] = React.useState<ChatFilter>('all');

  const filteredChats = React.useMemo(() => {
    const byFilter = CHAT_PREVIEWS.filter((item) => {
      if (activeFilter === 'all') {
        return true;
      }

      if (activeFilter === 'personal') {
        return item.roomType === 'personal';
      }

      if (activeFilter === 'group') {
        return item.roomType === 'group' && item.status !== 'ended';
      }

      return item.status === 'ended';
    });

    if (!searchQuery.trim()) {
      return byFilter;
    }

    const normalizedQuery = searchQuery.trim().toLowerCase();

    return byFilter.filter((item) => {
      const searchable = `${item.name} ${item.senderName ?? ''} ${item.message}`.toLowerCase();
      return searchable.includes(normalizedQuery);
    });
  }, [activeFilter, searchQuery]);

  return {
    chats: filteredChats,
    searchQuery,
    setSearchQuery,
    activeFilter,
    setActiveFilter,
  };
}