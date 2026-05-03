import React, {
	createContext,
	useContext,
	useState,
	useCallback,
	type ReactNode,
} from "react";
import { View, Text, StyleSheet, Animated } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../hooks/useTheme";

type ToastType = "success" | "error" | "info" | "warning";

interface Toast {
	id: string;
	message: string;
	type: ToastType;
	duration?: number;
}

interface ToastContextType {
	showToast: (message: string, type?: ToastType, duration?: number) => void;
	showSuccess: (message: string, duration?: number) => void;
	showError: (message: string, duration?: number) => void;
	showInfo: (message: string, duration?: number) => void;
	hideToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
	const [toasts, setToasts] = useState<Toast[]>([]);

	const hideToast = useCallback((id: string) => {
		setToasts((prev) => prev.filter((t) => t.id !== id));
	}, []);

	const showToast = useCallback(
		(message: string, type: ToastType = "info", duration = 3000) => {
			const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
			const toast: Toast = { id, message, type, duration };

			setToasts((prev) => [...prev, toast]);

			if (duration > 0) {
				setTimeout(() => {
					hideToast(id);
				}, duration);
			}

			return id;
		},
		[hideToast],
	);

	const showSuccess = useCallback(
		(message: string, duration?: number) => {
			return showToast(message, "success", duration);
		},
		[showToast],
	);

	const showError = useCallback(
		(message: string, duration?: number) => {
			return showToast(message, "error", duration ?? 5000);
		},
		[showToast],
	);

	const showInfo = useCallback(
		(message: string, duration?: number) => {
			return showToast(message, "info", duration);
		},
		[showToast],
	);

	return (
		<ToastContext.Provider
			value={{ showToast, showSuccess, showError, showInfo, hideToast }}
		>
			{children}
			<ToastContainer toasts={toasts} onHide={hideToast} />
		</ToastContext.Provider>
	);
}

export function useToast() {
	const context = useContext(ToastContext);
	if (!context) {
		throw new Error("useToast must be used within a ToastProvider");
	}
	return context;
}

// Toast container component
function ToastContainer({
	toasts,
	onHide,
}: {
	toasts: Toast[];
	onHide: (id: string) => void;
}) {
	const { colors, metrics, typography } = useTheme();

	if (toasts.length === 0) return null;

	return (
		<View style={styles.container} pointerEvents="none">
			{toasts.map((toast, index) => (
				<ToastItem
					key={toast.id}
					toast={toast}
					index={index}
					colors={colors}
					metrics={metrics}
					typography={typography}
					onHide={onHide}
				/>
			))}
		</View>
	);
}

// Individual toast item with animation
function ToastItem({
	toast,
	index,
	colors,
	metrics,
	typography,
	onHide,
}: {
	toast: Toast;
	index: number;
	colors: any;
	metrics: any;
	typography: any;
	onHide: (id: string) => void;
}) {
	const translateY = React.useRef(new Animated.Value(-100)).current;
	const opacity = React.useRef(new Animated.Value(0)).current;

	React.useEffect(() => {
		Animated.parallel([
			Animated.timing(translateY, {
				toValue: 0,
				duration: 300,
				useNativeDriver: true,
			}),
			Animated.timing(opacity, {
				toValue: 1,
				duration: 300,
				useNativeDriver: true,
			}),
		]).start();
	}, [translateY, opacity]);

	const getIconName = (type: ToastType): keyof typeof Ionicons.glyphMap => {
		switch (type) {
			case "success":
				return "checkmark-circle";
			case "error":
				return "close-circle";
			case "warning":
				return "warning";
			default:
				return "information-circle";
		}
	};

	const getColors = (type: ToastType) => {
		switch (type) {
			case "success":
				return {
					bg: "#22C55E",
					icon: "#FFFFFF",
				};
			case "error":
				return {
					bg: colors.error || "#EF4444",
					icon: "#FFFFFF",
				};
			case "warning":
				return {
					bg: "#F59E0B",
					icon: "#FFFFFF",
				};
			default:
				return {
					bg: colors.primary,
					icon: "#FFFFFF",
				};
		}
	};

	const colorScheme = getColors(toast.type);

	return (
		<Animated.View
			style={[
				styles.toast,
				{
					backgroundColor: colorScheme.bg,
					transform: [{ translateY }],
					opacity,
					top: 50 + index * 70,
				},
			]}
		>
			<Ionicons
				name={getIconName(toast.type)}
				size={20}
				color={colorScheme.icon}
				style={styles.icon}
			/>
			<Text style={[styles.message, { color: colorScheme.icon, fontSize: typography.sizes.sm }]}>
				{toast.message}
			</Text>
		</Animated.View>
	);
}

const styles = StyleSheet.create({
	container: {
		position: "absolute",
		top: 0,
		left: 0,
		right: 0,
		zIndex: 9999,
		alignItems: "center",
	},
	toast: {
		position: "absolute",
		flexDirection: "row",
		alignItems: "center",
		paddingHorizontal: 16,
		paddingVertical: 12,
		borderRadius: 12,
		marginHorizontal: 20,
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.15,
		shadowRadius: 12,
		elevation: 8,
		minWidth: 200,
		maxWidth: "90%",
	},
	icon: {
		marginRight: 10,
	},
	message: {
		fontWeight: "600",
		flex: 1,
	},
});
