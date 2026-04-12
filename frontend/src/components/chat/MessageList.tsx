import React from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { ChatMessage } from '../../types/chat';
import { MessageBubble } from './MessageBubble';
import { TypingIndicator } from './TypingIndicator';

interface MessageListProps {
  messages: ChatMessage[];
  showTyping?: boolean;
}

export function MessageList({ messages, showTyping = false }: MessageListProps) {
  const { colors, metrics } = useTheme();
  const listRef = React.useRef<FlatList<ChatMessage>>(null);

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
        typingWrap: {
          alignSelf: 'flex-start',
          marginLeft: 56,
          borderRadius: metrics.radius.xl,
          backgroundColor: colors.chatIncomingBubbleBg,
          borderWidth: 1,
          borderColor: colors.border,
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
      renderItem={({ item }) => <MessageBubble message={item} />}
      showsVerticalScrollIndicator={false}
      style={styles.list}
    />
  );
}