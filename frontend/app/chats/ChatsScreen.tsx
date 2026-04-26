import React from "react";
import { FlatList, RefreshControl, StyleSheet, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import {
	ChatHeader,
	ChatItem,
	FilterTabs,
	SearchBar,
} from "../../src/components/chat";
import { useChatListData } from "../../src/hooks/useChatListData";
import { useTheme } from "../../src/hooks/useTheme";
import type { ChatPreview } from "../../src/types/chat";

export default function ChatsScreen() {
	const router = useRouter();
	const params = useLocalSearchParams<{
		riderId?: string;
		name?: string;
		avatar?: string;
		username?: string;
		autoOpen?: string;
	}>();
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
	const hasAutoOpenedRef = React.useRef(false);

	const openChat = React.useCallback(
		(item: ChatPreview) => {
			const { id: chatId, roomType, status } = item;
			if (roomType === "group") {
				const roomName =
					typeof item.name === "string" && item.name.trim().length > 0
						? item.name
						: undefined;

				if (status === "ended") {
					router.push({
						pathname: `/group-chat/${chatId}`,
						params: { status: "ended", name: roomName },
					});
					return;
				}

				router.push({
					pathname: `/group-chat/${chatId}`,
					params: { name: roomName },
				});
				return;
			}

			router.push({
				pathname: `/chats/${chatId}`,
				params: {
					name: item.name,
					avatar: item.avatar,
					username: item.username,
				},
			});
		},
		[router],
	);

	React.useEffect(() => {
		if (
			typeof params.riderId !== "string" ||
			params.riderId.trim().length === 0 ||
			hasAutoOpenedRef.current
		) {
			return;
		}

		if (params.autoOpen === "0") {
			return;
		}

		hasAutoOpenedRef.current = true;
		router.push({
			pathname: `/chats/${params.riderId}`,
			params: {
				name: typeof params.name === "string" ? params.name : undefined,
				avatar: typeof params.avatar === "string" ? params.avatar : undefined,
				username:
					typeof params.username === "string" ? params.username : undefined,
			},
		});
	}, [params.autoOpen, params.avatar, params.name, params.riderId, params.username, router]);

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
		<SafeAreaView edges={["top", "left", "right", "bottom"]} style={styles.safeArea}>
			<View style={styles.container}>
				<ChatHeader
					accentBack
					onBack={() => router.back()}
					rightMode="none"
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
							onPress={() => openChat(item)}
						/>
					)}
					showsVerticalScrollIndicator={false}
				/>
			</View>
		</SafeAreaView>
	);
}
