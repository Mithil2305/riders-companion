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

			router.push({
				pathname: `/chats/${chatId}`,
				params: {
					name: item.name,
					avatar: item.avatar,
					username:
						typeof params.username === "string" && params.username.trim().length > 0
							? params.username
							: undefined,
				},
			});
		},
		[params.username, router],
	);

	const profileChatPreview = React.useMemo<ChatPreview | null>(() => {
		if (typeof params.riderId !== "string" || params.riderId.trim().length === 0) {
			return null;
		}

		const name =
			typeof params.name === "string" && params.name.trim().length > 0
				? params.name
				: "Rider";
		const avatar =
			typeof params.avatar === "string" && params.avatar.trim().length > 0
				? params.avatar
				: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=0D8ABC&color=fff`;

		return {
			id: params.riderId,
			name,
			message: "Open conversation",
			time: "--:--",
			avatar,
			roomType: "personal",
			status: "active",
			isOnline: false,
		};
	}, [params.avatar, params.name, params.riderId]);

	const listData = React.useMemo(() => {
		if (!profileChatPreview) {
			return chats;
		}

		return [
			profileChatPreview,
			...chats.filter((item) => item.id !== profileChatPreview.id),
		];
	}, [chats, profileChatPreview]);

	React.useEffect(() => {
		if (!profileChatPreview || hasAutoOpenedRef.current) {
			return;
		}

		if (params.autoOpen === "0") {
			return;
		}

		hasAutoOpenedRef.current = true;
		openChat(profileChatPreview);
	}, [openChat, params.autoOpen, profileChatPreview]);

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
					data={listData}
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
