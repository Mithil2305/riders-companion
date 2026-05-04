import React from "react";
import { Pressable, StyleSheet, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../../hooks/useTheme";

interface GroupChatInputBarProps {
	value: string;
	onChange: (value: string) => void;
	onSend: () => void;
	disabled?: boolean;
}

export function GroupChatInputBar({
	value,
	onChange,
	onSend,
	disabled = false,
}: GroupChatInputBarProps) {
	const { colors, metrics, typography } = useTheme();
	const insets = useSafeAreaInsets();

	const styles = React.useMemo(
		() =>
			StyleSheet.create({
				root: {
					borderTopWidth: 1,
					borderTopColor: colors.border,
					backgroundColor: colors.background,
					paddingHorizontal: metrics.md,
					paddingTop: metrics.sm,
					paddingBottom: Math.max(metrics.md, insets.bottom),
					flexDirection: "row",
					alignItems: "center",
					gap: metrics.sm,
				},
				plusTap: {
					width: 44,
					height: 44,
					borderRadius: 22,
					backgroundColor: colors.chatComposerBg,
					alignItems: "center",
					justifyContent: "center",
				},
				field: {
					flex: 1,
					minHeight: 56,
					borderRadius: 22,
					backgroundColor: colors.chatComposerBg,
					borderWidth: 1,
					borderColor: colors.border,
					paddingHorizontal: metrics.md,
				},
				input: {
					flex: 1,
					color: colors.textPrimary,
					fontSize: typography.sizes["base"],
				},
				sendTap: {
					width: 48,
					height: 48,
					borderRadius: 30,
					alignItems: "center",
					justifyContent: "center",
					backgroundColor: colors.primary,
					shadowColor: colors.shadow,
					shadowOpacity: 0.2,
					shadowOffset: { width: 0, height: 5 },
					shadowRadius: 12,
					elevation: 6,
				},
				disabled: {
					opacity: 0.55,
				},
			}),
		[colors, metrics, typography, insets.bottom],
	);

	return (
		<View style={[styles.root, disabled ? styles.disabled : null]}>
			<Pressable
				accessibilityLabel="Add attachment"
				disabled={disabled}
				style={styles.plusTap}
			>
				<Ionicons color={colors.icon} name="add" size={28} />
			</Pressable>

			<View style={styles.field}>
				<TextInput
					editable={!disabled}
					onChangeText={onChange}
					onSubmitEditing={onSend}
					placeholder="Send a message..."
					placeholderTextColor={colors.textTertiary}
					style={styles.input}
					value={value}
				/>
			</View>

			<Pressable
				accessibilityLabel="Send message"
				disabled={disabled}
				onPress={onSend}
				style={styles.sendTap}
			>
				<Ionicons color={colors.textInverse} name="send" size={28} />
			</Pressable>
		</View>
	);
}
