import React from "react"
import {
	ActivityIndicator,
	FlatList,
	Image,
	Pressable,
	StyleSheet,
	Text,
	View,
} from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { useRouter } from "expo-router"
import { useTheme } from "../../hooks/useTheme"
import { SuggestedUser } from "../../types/explore"

interface SearchSuggestionsProps {
	results: SuggestedUser[]
	isLoading: boolean
	query: string
	onClose?: () => void
}

function formatFollowers(count: number): string {
	if (count >= 1_000_000) {
		return `${(count / 1_000_000).toFixed(1)}M`
	}
	if (count >= 1_000) {
		return `${(count / 1_000).toFixed(1)}K`
	}
	return `${count}`
}

const SuggestionRow = React.memo(function SuggestionRow({
	user,
	onPress,
}: {
	user: SuggestedUser
	onPress: () => void
}) {
	const { colors, metrics, typography } = useTheme()

	const styles = React.useMemo(
		() =>
			StyleSheet.create({
				row: {
					flexDirection: "row",
					alignItems: "center",
					paddingHorizontal: metrics.md,
					paddingVertical: 10,
					gap: metrics.md,
				},
				avatar: {
					width: 48,
					height: 48,
					borderRadius: 24,
					backgroundColor: colors.surface,
				},
				textCol: {
					flex: 1,
					justifyContent: "center",
				},
				nameRow: {
					flexDirection: "row",
					alignItems: "center",
					gap: 4,
				},
				username: {
					color: colors.textPrimary,
					fontSize: typography.sizes.base,
					fontWeight: "700",
				},
				subtitle: {
					color: colors.textSecondary,
					fontSize: typography.sizes.sm,
					marginTop: 2,
				},
				verified: {
					marginLeft: 2,
				},
			}),
		[colors, metrics, typography],
	)

	return (
		<Pressable onPress={onPress} style={styles.row}>
			<Image
				source={{ uri: user.avatar || undefined }}
				style={styles.avatar}
				resizeMode="cover"
			/>
			<View style={styles.textCol}>
				<View style={styles.nameRow}>
					<Text style={styles.username} numberOfLines={1}>
						{user.username}
					</Text>
					{user.isVerified && (
						<Ionicons
							name="checkmark-circle"
							size={16}
							color={colors.primary}
							style={styles.verified}
						/>
					)}
				</View>
				<Text style={styles.subtitle} numberOfLines={1}>
					{user.name}
					{user.followersCount
						? ` - ${formatFollowers(user.followersCount)} trackers`
						: ""}
				</Text>
			</View>
		</Pressable>
	)
})

export function SearchSuggestions({
	results,
	isLoading,
	query,
	onClose,
}: SearchSuggestionsProps) {
	const { colors, metrics, typography } = useTheme()
	const router = useRouter()

	const styles = React.useMemo(
		() =>
			StyleSheet.create({
				container: {
					flex: 1,
					backgroundColor: colors.background,
				},
				empty: {
					paddingTop: metrics.xl,
					alignItems: "center",
				},
				emptyText: {
					color: colors.textSecondary,
					fontSize: typography.sizes.base,
				},
				loader: {
					paddingVertical: metrics.lg,
				},
				sectionHeader: {
					paddingHorizontal: metrics.md,
					paddingTop: metrics.md,
					paddingBottom: metrics.sm,
				},
				sectionTitle: {
					color: colors.textPrimary,
					fontSize: typography.sizes.lg,
					fontWeight: "700",
				},
			}),
		[colors, metrics, typography],
	)

	const handlePress = React.useCallback(
		(user: SuggestedUser) => {
			onClose?.()
			router.push(`/rider/${user.id}` as any)
		},
		[onClose, router],
	)

	if (isLoading) {
		return (
			<View style={styles.loader}>
				<ActivityIndicator color={colors.primary} />
			</View>
		)
	}

	if (query.length > 0 && results.length === 0) {
		return (
			<View style={styles.empty}>
				<Text style={styles.emptyText}>No results for &quot;{query}&quot;</Text>
			</View>
		)
	}

	return (
		<View style={styles.container}>
			{query.length === 0 && (
				<View style={styles.sectionHeader}>
					<Text style={styles.sectionTitle}>Suggested</Text>
				</View>
			)}
			<FlatList
				data={results}
				initialNumToRender={8}
				keyExtractor={(item) => item.id}
				keyboardDismissMode="on-drag"
				maxToRenderPerBatch={10}
				removeClippedSubviews
				renderItem={({ item }) => (
					<SuggestionRow user={item} onPress={() => handlePress(item)} />
				)}
				keyboardShouldPersistTaps="handled"
				showsVerticalScrollIndicator={false}
				windowSize={6}
			/>
		</View>
	)
}
