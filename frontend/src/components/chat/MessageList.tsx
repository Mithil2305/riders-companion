import React from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { PersonalChatListItem } from '../../types/chat';
import { MessageBubble } from './MessageBubble';
import { TypingIndicator } from './TypingIndicator';

interface MessageListProps {
  messages: PersonalChatListItem[];
  showTyping?: boolean;
  onInviteAction?: (messageId: string, action: 'join' | 'reject') => void;
}

export function MessageList({ messages, showTyping = false, onInviteAction }: MessageListProps) {
  const { colors, metrics } = useTheme();
  const listRef = React.useRef<FlatList<PersonalChatListItem>>(null);

  const styles = React.useMemo(
    () =>
      StyleSheet.create({
        list: {
          flex: 1,
          backgroundColor: colors.background,
        },
        listContent: {
          paddingHorizontal: metrics.md,
          paddingTop: metrics.md,
          paddingBottom: metrics['2xl'],
        },
        separatorWrap: {
          alignItems: 'center',
          marginVertical: metrics.sm,
        },
        separator: {
          borderRadius: metrics.radius.full,
          backgroundColor: colors.chatDateBadgeBg,
          paddingHorizontal: metrics.md,
          paddingVertical: metrics.xs + 2,
        },
        separatorText: {
          color: colors.chatDateBadgeText,
          fontSize: 12,
          letterSpacing: 1,
          fontWeight: '500',
        },
        typingWrap: {
          alignSelf: 'flex-start',
          marginLeft: metrics.sm,
          borderRadius: metrics.radius.xl,
          backgroundColor: colors.chatIncomingBubbleBg,
          marginBottom: metrics.sm,
        },
      }),
    [colors, metrics],
  );

  React.useEffect(() => {
    requestAnimationFrame(() => {
      listRef.current?.scrollToEnd({ animated: true });
    });
  }, [messages, showTyping]);

  return (
    <FlatList
      ListFooterComponent={
        showTyping ? (
          <View style={styles.typingWrap}>
            <TypingIndicator />
          </View>
        ) : null
      }
      contentContainerStyle={styles.listContent}
      data={messages}
      keyExtractor={(item) => item.id}
      ref={listRef}
      renderItem={({ item }) =>
        item.kind === 'date-separator' ? (
          <View style={styles.separatorWrap}>
            <View style={styles.separator}>
              <Text style={styles.separatorText}>{item.label}</Text>
            </View>
          </View>
        ) : (
          <MessageBubble message={item} onInviteAction={onInviteAction} />
        )
      }
      showsVerticalScrollIndicator={false}
      style={styles.list}
    />
  );
}