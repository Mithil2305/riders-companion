import React from 'react';
import { Alert, FlatList, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChatHeader, ChatItem, FilterTabs, SearchBar } from '../../src/components/chat';
import { useChatListData } from '../../src/hooks/useChatListData';
import { useTheme } from '../../src/hooks/useTheme';

export default function ChatListScreen() {
  const router = useRouter();
  const { colors, metrics } = useTheme();
  const { chats, searchQuery, setSearchQuery, activeFilter, setActiveFilter } = useChatListData();

  const styles = React.useMemo(
    () =>
      StyleSheet.create({
        safeArea: {
          flex: 1,
          backgroundColor: colors.background,
        },
        container: {
          flex: 1,
          backgroundColor: colors.background,
        },
        listContent: {
          paddingBottom: metrics['2xl'],
        },
      }),
    [colors, metrics],
  );

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.safeArea}>
      <View style={styles.container}>
        <ChatHeader onBack={() => router.back()} title="Chats" />
        <SearchBar onChangeText={setSearchQuery} value={searchQuery} />
        <FilterTabs activeFilter={activeFilter} onChange={setActiveFilter} />

        <FlatList
          contentContainerStyle={styles.listContent}
          data={chats}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ChatItem
              item={item}
              onLongPress={() => {
                Alert.alert('Chat actions', `Actions for ${item.name} will be available soon.`);
              }}
              onPress={() => router.push(`/room/${item.id}`)}
            />
          )}
          showsVerticalScrollIndicator={false}
        />
      </View>
    </SafeAreaView>
  );
}