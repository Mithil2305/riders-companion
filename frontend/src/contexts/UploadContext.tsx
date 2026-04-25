import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../hooks/useTheme";
import UploadService, { QueuedUploadInput } from "../services/UploadService";
import { UploadType } from "../types/upload";

type UploadStatus = "preparing" | "uploading" | "success" | "error";

type UploadTaskState = {
	id: string;
	type: UploadType;
	status: UploadStatus;
	progress: number;
	message: string;
};

type UploadContextType = {
	activeUpload: UploadTaskState | null;
	lastCompletedUploadAt: number;
	startUpload: (input: QueuedUploadInput) => Promise<void>;
};

const UploadContext = React.createContext<UploadContextType | undefined>(
	undefined,
);

const uploadTypeLabel: Record<UploadType, string> = {
	post: "moment",
	story: "story",
	clip: "clip",
};

export function UploadProvider({ children }: { children: React.ReactNode }) {
	const { colors, metrics, typography } = useTheme();
	const insets = useSafeAreaInsets();
	const [activeUpload, setActiveUpload] = React.useState<UploadTaskState | null>(
		null,
	);
	const [lastCompletedUploadAt, setLastCompletedUploadAt] = React.useState(0);
	const clearTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(
		null,
	);

	const scheduleClear = React.useCallback((taskId: string, delayMs: number) => {
		if (clearTimeoutRef.current) {
			clearTimeout(clearTimeoutRef.current);
		}

		clearTimeoutRef.current = setTimeout(() => {
			setActiveUpload((current) => (current?.id === taskId ? null : current));
		}, delayMs);
	}, []);

	React.useEffect(() => {
		return () => {
			if (clearTimeoutRef.current) {
				clearTimeout(clearTimeoutRef.current);
			}
		};
	}, []);

	const startUpload = React.useCallback(
		async (input: QueuedUploadInput) => {
			if (
				activeUpload != null &&
				(activeUpload.status === "preparing" ||
					activeUpload.status === "uploading")
			) {
				throw new Error("Please wait for the current upload to finish.");
			}

			const id = `${Date.now()}`;
			const typeLabel = uploadTypeLabel[input.uploadType];

			setActiveUpload({
				id,
				type: input.uploadType,
				status: "preparing",
				progress: 8,
				message: `Preparing ${typeLabel}...`,
			});

			void (async () => {
				try {
					await UploadService.uploadWithProgress(input, (networkProgress) => {
						setActiveUpload((current) => {
							if (current?.id !== id) {
								return current;
							}

							const progress = Math.max(12, Math.min(100, networkProgress));
							return {
								...current,
								status: "uploading",
								progress,
								message: `Uploading ${typeLabel}...`,
							};
						});
					});

					setActiveUpload({
						id,
						type: input.uploadType,
						status: "success",
						progress: 100,
						message: `${typeLabel[0].toUpperCase()}${typeLabel.slice(1)} uploaded successfully`,
					});
					setLastCompletedUploadAt(Date.now());
					scheduleClear(id, 2600);
				} catch (error) {
					setActiveUpload({
						id,
						type: input.uploadType,
						status: "error",
						progress: 100,
						message:
							error instanceof Error
								? error.message
								: `Unable to upload ${typeLabel}.`,
					});
					scheduleClear(id, 4200);
				}
			})();
		},
		[activeUpload, scheduleClear],
	);

	const styles = React.useMemo(
		() =>
			StyleSheet.create({
				overlayWrap: {
					position: "absolute",
					top: insets.top + metrics.sm,
					left: metrics.md,
					right: metrics.md,
					zIndex: 2000,
				},
				card: {
					borderRadius: metrics.radius.lg,
					backgroundColor: colors.card,
					borderWidth: 1,
					borderColor: colors.border,
					paddingHorizontal: metrics.md,
					paddingVertical: metrics.sm,
					shadowColor: colors.shadow,
					shadowOffset: { width: 0, height: 8 },
					shadowOpacity: 0.16,
					shadowRadius: 18,
					elevation: 10,
					gap: metrics.xs,
				},
				titleRow: {
					flexDirection: "row",
					alignItems: "center",
					justifyContent: "space-between",
				},
				title: {
					color: colors.textPrimary,
					fontSize: typography.sizes.sm,
					fontWeight: "700",
				},
				percent: {
					color: colors.textSecondary,
					fontSize: typography.sizes.xs,
					fontWeight: "700",
				},
				message: {
					color: colors.textSecondary,
					fontSize: typography.sizes.xs,
				},
				track: {
					height: 6,
					borderRadius: metrics.radius.full,
					backgroundColor: colors.surface,
					overflow: "hidden",
				},
				fill: {
					height: "100%",
					borderRadius: metrics.radius.full,
				},
			}),
		[colors, insets.top, metrics, typography],
	);

	const fillColor =
		activeUpload?.status === "error"
			? colors.error
			: activeUpload?.status === "success"
				? colors.success ?? colors.primary
				: colors.primary;

	return (
		<UploadContext.Provider
			value={{
				activeUpload,
				lastCompletedUploadAt,
				startUpload,
			}}
		>
			{children}
			{activeUpload ? (
				<View pointerEvents="none" style={styles.overlayWrap}>
					<View style={styles.card}>
						<View style={styles.titleRow}>
							<Text style={styles.title}>
								{activeUpload.status === "uploading"
									? "Uploading"
									: activeUpload.status === "preparing"
										? "Preparing Upload"
										: activeUpload.status === "success"
											? "Upload Complete"
											: "Upload Failed"}
							</Text>
							<Text style={styles.percent}>{activeUpload.progress}%</Text>
						</View>
						<Text style={styles.message}>{activeUpload.message}</Text>
						<View style={styles.track}>
							<View
								style={[
									styles.fill,
									{
										width: `${activeUpload.progress}%`,
										backgroundColor: fillColor,
									},
								]}
							/>
						</View>
					</View>
				</View>
			) : null}
		</UploadContext.Provider>
	);
}

export function useUploadManager() {
	const context = React.useContext(UploadContext);
	if (context === undefined) {
		throw new Error("useUploadManager must be used within an UploadProvider");
	}

	return context;
}
