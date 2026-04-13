import React from 'react';
import { FlatList, StyleSheet } from 'react-native';
import { useTheme } from '../../../hooks/useTheme';
import { GroupChatItem } from '../../../types/groupChat';
import { GroupMessageBubble } from './GroupMessageBubble';

interface GroupChatListProps {
  data: GroupChatItem[];
}

export function GroupChatList({ data }: GroupChatListProps) {
  const { colors, metrics } = useTheme();
  const listRef = React.useRef<FlatList<GroupChatItem>>(null);

  const styles = React.useMemo(
    () =>
      StyleSheet.create({
        list: {
          flex: 1,
          backgroundColor: colors.chatSearchBg,
        },
        content: {
          paddingHorizontal: metrics.md,
          paddingTop: metrics.md,
          paddingBottom: metrics.md,
        },
      }),
    [colors, metrics],
  );

  React.useEffect(() => {
    requestAnimationFrame(() => {
      listRef.current?.scrollToEnd({ animated: true });
    });
  }, [data]);

  return (
    <FlatList
      contentContainerStyle={styles.content}
      data={data}
      keyExtractor={(item) => item.id}
      ref={listRef}
      renderItem={({ item }) => <GroupMessageBubble item={item} />}
      showsVerticalScrollIndicator={false}
      style={styles.list}
    />
  );
}
