import React from "react";
import { FlatList, RefreshControl, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import {
	ChatHeader,
	ChatItem,
	FilterTabs,
	SearchBar,
} from "../../src/components/chat";
import { useChatListData } from "../../src/hooks/useChatListData";
import { useTheme } from "../../src/hooks/useTheme";

export default function ChatsScreen() {
	const router = useRouter();
	const { colors, metrics } = useTheme();
	const {
		chats,
		refreshing,
		refreshChats,
		searchQuery,
		setSearchQuery,
		activeFilter,
		setActiveFilter,
	} = useChatListData();

	const openChat = React.useCallback(
		(
			chatId: string,
			roomType: "personal" | "group",
			status?: "active" | "ended",
		) => {
			if (roomType === "group") {
				if (status === "ended") {
					router.push({
						pathname: `/group-chat/${chatId}`,
						params: { status: "ended" },
					});
					return;
				}

				router.push(`/group-chat/${chatId}`);
				return;
			}

			router.push(`/chats/${chatId}`);
		},
		[router],
	);

	const styles = React.useMemo(
		() =>
			StyleSheet.create({
				safeArea: {
					flex: 1,
					backgroundColor: colors.chatListBackground,
				},
				container: {
					flex: 1,
					backgroundColor: colors.chatListBackground,
				},
				listContent: {
					paddingBottom: metrics["3xl"] * 2,
				},
			}),
		[colors, metrics],
	);

	return (
		<SafeAreaView edges={["top", "left", "right"]} style={styles.safeArea}>
			<View style={styles.container}>
				<ChatHeader
					accentBack
					onBack={() => router.back()}
					rightMode="menu"
					title="Messages"
				/>
				<SearchBar onChangeText={setSearchQuery} value={searchQuery} />
				<FilterTabs activeFilter={activeFilter} onChange={setActiveFilter} />

				<FlatList
					contentContainerStyle={styles.listContent}
					data={chats}
					keyExtractor={(item) => item.id}
					refreshControl={
						<RefreshControl
							colors={[colors.primary]}
							onRefresh={refreshChats}
							progressBackgroundColor={colors.surface}
							refreshing={refreshing}
							tintColor={colors.primary}
						/>
					}
					renderItem={({ item }) => (
						<ChatItem
							item={item}
							onPress={() => openChat(item.id, item.roomType, item.status)}
						/>
					)}
					showsVerticalScrollIndicator={false}
				/>
			</View>
		</SafeAreaView>
	);
}
