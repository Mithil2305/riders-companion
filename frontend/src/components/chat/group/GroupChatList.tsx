import React from "react";
import { FlatList, StyleSheet, View } from "react-native";
import { useTheme } from "../../../hooks/useTheme";
import { GroupChatItem } from "../../../types/groupChat";
import { GroupMessageBubble } from "./GroupMessageBubble";

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
		requestAnimationFrame(() => {
			listRef.current?.scrollToEnd({ animated: true });
		});
	}, [data]);

	return (
		<FlatList
			contentContainerStyle={styles.content}
			data={data}
			ItemSeparatorComponent={() => <View style={{ height: 2 }} />}
			keyExtractor={(item) => item.id}
			ref={listRef}
			renderItem={({ item }) => <GroupMessageBubble item={item} />}
			showsVerticalScrollIndicator={false}
			style={styles.list}
		/>
	);
}
