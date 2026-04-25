import React from "react"
import { Pressable, StyleSheet, TextInput, View } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { useTheme } from "../../hooks/useTheme"

interface SearchBarProps {
	value: string
	onChangeText: (value: string) => void
	onFocus?: () => void
	onBlur?: () => void
}

export function SearchBar({ value, onChangeText, onFocus, onBlur }: SearchBarProps) {
	const { colors, metrics, resolvedMode, typography } = useTheme()
	const isDark = resolvedMode === "dark"
	const inputRef = React.useRef<TextInput>(null)

	const styles = React.useMemo(
		() =>
			StyleSheet.create({
				searchWrap: {
					height: 46,
					borderRadius: 24,
					backgroundColor: isDark ? "#2B2525" : "#F2F2F2",
					flexDirection: "row",
					alignItems: "center",
					paddingHorizontal: metrics.md,
					gap: metrics.sm,
				},
				input: {
					flex: 1,
					color: colors.textPrimary,
					fontSize: typography.sizes.base,
					paddingVertical: 0,
				},
				clearBtn: {
					width: 22,
					height: 22,
					borderRadius: 11,
					backgroundColor: isDark ? "rgba(248,242,222,0.15)" : "rgba(0,0,0,0.12)",
					alignItems: "center",
					justifyContent: "center",
				},
			}),
		[colors, isDark, metrics, typography],
	)

	return (
		<View style={styles.searchWrap}>
			<Ionicons name="search" size={20} color={colors.textSecondary} />
			<TextInput
				ref={inputRef}
				style={styles.input}
				placeholder="Search"
				placeholderTextColor={colors.textSecondary}
				value={value}
				onChangeText={onChangeText}
				onFocus={onFocus}
				onBlur={onBlur}
				autoCapitalize="none"
				autoCorrect={false}
			/>
			{value.length > 0 && (
				<Pressable
					onPress={() => {
						onChangeText("")
						inputRef.current?.focus()
					}}
					style={styles.clearBtn}
					hitSlop={8}
				>
					<Ionicons
						name="close"
						size={14}
						color={isDark ? colors.textSecondary : colors.textSecondary}
					/>
				</Pressable>
			)}
		</View>
	)
}
