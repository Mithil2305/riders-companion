import React from 'react';
import { ChatFilter, ChatPreview } from '../types/chat';

const CHAT_PREVIEWS: ChatPreview[] = [
  {
    id: '1',
    name: 'Cameron Williamson',
    message: 'Hiiii',
    time: '2m',
    avatar: 'https://i.pravatar.cc/120?img=33',
    unreadCount: 3,
    hasUnreadDot: true,
    category: 'mutual',
  },
  {
    id: '2',
    name: 'Annette Black',
    message: 'curtis.weaver@example.com',
    time: '5m',
    avatar: 'https://i.pravatar.cc/120?img=5',
    category: 'new',
  },
  {
    id: '3',
    name: 'Marvin McKinney',
    message: 'How are you',
    time: '3m',
    avatar: 'https://i.pravatar.cc/120?img=12',
    unreadCount: 1,
    hasUnreadDot: true,
    category: 'mutual',
  },
  {
    id: '4',
    name: 'Brooklyn Simmons',
    message: 'Available for group rides',
    time: '15m',
    avatar: 'https://i.pravatar.cc/120?img=29',
    category: 'group',
  },
  {
    id: '5',
    name: 'Devon Lane',
    message: 'Mountain bike enthusiast',
    time: '1m',
    avatar: 'https://i.pravatar.cc/120?img=45',
    unreadCount: 5,
    hasUnreadDot: true,
    category: 'mutual',
  },
];

export function useChatListData() {
  const [searchQuery, setSearchQuery] = React.useState('');
  const [activeFilter, setActiveFilter] = React.useState<ChatFilter>('mutual');

  const filteredChats = React.useMemo(() => {
    const byFilter = CHAT_PREVIEWS.filter((item) => item.category === activeFilter);

    if (!searchQuery.trim()) {
      return byFilter;
    }

    const normalizedQuery = searchQuery.trim().toLowerCase();

    return byFilter.filter((item) => {
      const searchable = `${item.name} ${item.message}`.toLowerCase();
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