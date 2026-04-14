import React from "react";
import ChatService from "../services/ChatService";
import {
  PersonalChatListItem,
  PersonalChatMenuAction,
  PersonalChatMessage,
  PersonalChatMeta,
} from "../types/chat";

const FALLBACK_META: PersonalChatMeta = {
  roomId: "1",
  name: "Ride Buddy",
  avatar: "https://i.pravatar.cc/120?img=68",
  isOnline: true,
  rideTogetherLabel: "YOU RODE TOGETHER ON: CHENNAI → OOTY",
};

const toDayKey = (isoDate: string) => {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) {
    return "unknown";
  }

  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
};

const toDayLabel = (isoDate: string) => {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) {
    return "TODAY";
  }

  const now = new Date();
  const nowKey = toDayKey(now.toISOString());
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const yesterdayKey = toDayKey(yesterday.toISOString());
  const dateKey = toDayKey(isoDate);

  if (dateKey === nowKey) {
    return "TODAY";
  }

  if (dateKey === yesterdayKey) {
    return "YESTERDAY";
  }

  return date.toLocaleDateString([], {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
};

const toListItems = (messages: PersonalChatMessage[]): PersonalChatListItem[] => {
  const grouped: PersonalChatListItem[] = [];
  let lastDay = "";

  for (const message of messages) {
    const dayKey = toDayKey(message.createdAt);
    if (dayKey !== lastDay) {
      grouped.push({
        id: `sep-${dayKey}-${message.id}`,
        kind: "date-separator",
        label: toDayLabel(message.createdAt),
      });
      lastDay = dayKey;
    }

    grouped.push(message);
  }

  return grouped;
};

export function useChat(roomId: string) {
  const [meta, setMeta] = React.useState<PersonalChatMeta>(() => ({
    ...FALLBACK_META,
    roomId,
  }));
  const [messages, setMessages] = React.useState<PersonalChatMessage[]>([]);
  const [draft, setDraft] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(true);
  const [isMenuVisible, setIsMenuVisible] = React.useState(false);
  const [isMuted, setIsMuted] = React.useState(false);
  const [isBlocked, setIsBlocked] = React.useState(false);

  React.useEffect(() => {
    let isMounted = true;

    setIsLoading(true);
    setDraft("");

    ChatService.getPersonalConversation(roomId)
      .then((response) => {
        if (!isMounted) {
          return;
        }

        setMeta(response.meta);
        setMessages(response.messages);
      })
      .catch(() => {
        if (!isMounted) {
          return;
        }

        setMeta({ ...FALLBACK_META, roomId });
        setMessages([]);
      })
      .finally(() => {
        if (!isMounted) {
          return;
        }

        setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [roomId]);

  const sendMessage = React.useCallback(async () => {
    const trimmed = draft.trim();
    if (!trimmed || isBlocked) {
      return;
    }

    const next = await ChatService.sendPersonalMessage(roomId, {
      kind: "text",
      text: trimmed,
    });

    setMessages((prev) => [...prev, next]);
    setDraft("");
  }, [draft, isBlocked, roomId]);

  const clearChat = React.useCallback(async () => {
    await ChatService.clearPersonalConversation(roomId);
    setMessages([]);
    setIsMenuVisible(false);
  }, [roomId]);

  const muteNotifications = React.useCallback(async () => {
    const nextMuted = !isMuted;
    const response = await ChatService.mutePersonalConversation(roomId, nextMuted);
    setIsMuted(response.muted);
    setIsMenuVisible(false);
  }, [isMuted, roomId]);

  const blockUser = React.useCallback(async () => {
    const response = await ChatService.blockPersonalUser(roomId);
    setIsBlocked(response.blocked);
    setIsMenuVisible(false);
  }, [roomId]);

  const runMenuAction = React.useCallback(
    async (action: PersonalChatMenuAction) => {
      if (action === "voice-call" || action === "video-call") {
        setIsMenuVisible(false);
        return;
      }

      if (action === "clear-chat") {
        await clearChat();
        return;
      }

      if (action === "mute-notifications") {
        await muteNotifications();
        return;
      }

      if (action === "block-user") {
        await blockUser();
      }
    },
    [blockUser, clearChat, muteNotifications],
  );

  const listData = React.useMemo(() => toListItems(messages), [messages]);

  const openMenu = React.useCallback(() => setIsMenuVisible(true), []);
  const closeMenu = React.useCallback(() => setIsMenuVisible(false), []);

  return {
    meta,
    listData,
    draft,
    setDraft,
    sendMessage,
    isLoading,
    isMenuVisible,
    openMenu,
    closeMenu,
    runMenuAction,
    isMuted,
    isBlocked,
  };
}
