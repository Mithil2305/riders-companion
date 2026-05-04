import React from "react";
import { FlatList, StyleSheet, View } from "react-native";
import { useTheme } from "../../../hooks/useTheme";
import { GroupChatItem } from "../../../types/groupChat";
import { MemoGroupMessageBubble } from "./GroupMessageBubble";

interface GroupChatListProps {
	data: GroupChatItem[];
}

export function GroupChatList({ data }: GroupChatListProps) {
	const { colors, metrics } = useTheme();
	const listRef = React.useRef<FlatList<GroupChatItem>>(null);
	const lastCountRef = React.useRef(0);

	const styles = React.useMemo(
		() =>
			StyleSheet.create({
				list: {
					flex: 1,
					backgroundColor: colors.background,
				},
				content: {
					paddingHorizontal: metrics.md,
					paddingTop: metrics.md + 2,
					paddingBottom: metrics.lg,
				},
			}),
		[colors.background, metrics],
	);

	React.useEffect(() => {
		if (data.length === lastCountRef.current) {
			return;
		}

		lastCountRef.current = data.length;
		requestAnimationFrame(() => {
			listRef.current?.scrollToEnd({ animated: true });
		});
	}, [data.length]);

	const renderItem = React.useCallback(
		({ item }: { item: GroupChatItem }) => (
			<MemoGroupMessageBubble item={item} />
		),
		[],
	);

	const keyExtractor = React.useCallback((item: GroupChatItem) => item.id, []);

	return (
		<FlatList
			contentContainerStyle={styles.content}
			data={data}
			ItemSeparatorComponent={() => <View style={{ height: 2 }} />}
			keyExtractor={keyExtractor}
			ref={listRef}
			renderItem={renderItem}
			showsVerticalScrollIndicator={false}
			style={styles.list}
		/>
	);
}
