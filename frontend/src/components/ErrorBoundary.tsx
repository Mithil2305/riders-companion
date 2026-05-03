import React, { Component, type ReactNode } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../hooks/useTheme";

interface Props {
	children: ReactNode;
	fallback?: ReactNode;
	onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface State {
	hasError: boolean;
	error: Error | null;
}

// Error boundary class component
class ErrorBoundaryClass extends Component<Props, State> {
	constructor(props: Props) {
		super(props);
		this.state = { hasError: false, error: null };
	}

	static getDerivedStateFromError(error: Error): State {
		return { hasError: true, error };
	}

	componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
		console.error("ErrorBoundary caught error:", error);
		console.error("Component stack:", errorInfo.componentStack);
		this.props.onError?.(error, errorInfo);
	}

	handleReset = () => {
		this.setState({ hasError: false, error: null });
	};

	render() {
		if (this.state.hasError) {
			if (this.props.fallback) {
				return this.props.fallback;
			}
			return (
				<ErrorFallback
					error={this.state.error}
					onReset={this.handleReset}
				/>
			);
		}

		return this.props.children;
	}
}

// Functional fallback component with theme support
function ErrorFallback({
	error,
	onReset,
}: {
	error: Error | null;
	onReset: () => void;
}) {
	const { colors, metrics, typography } = useTheme();

	const styles = StyleSheet.create({
		container: {
			flex: 1,
			backgroundColor: colors.background,
			alignItems: "center",
			justifyContent: "center",
			padding: metrics.xl,
		},
		icon: {
			marginBottom: metrics.lg,
		},
		title: {
			fontSize: typography.sizes.xl,
			fontWeight: "700",
			color: colors.textPrimary,
			marginBottom: metrics.sm,
			textAlign: "center",
		},
		subtitle: {
			fontSize: typography.sizes.sm,
			color: colors.textSecondary,
			textAlign: "center",
			marginBottom: metrics.lg,
		},
		errorDetails: {
			backgroundColor: colors.surface,
			borderRadius: 12,
			padding: metrics.md,
			marginBottom: metrics.lg,
			width: "100%",
			borderWidth: 1,
			borderColor: colors.border,
		},
		errorText: {
			fontSize: typography.sizes.sm,
			color: colors.error || "#EF4444",
			fontFamily: "monospace",
		},
		button: {
			backgroundColor: colors.primary,
			paddingHorizontal: metrics.xl,
			paddingVertical: metrics.md,
			borderRadius: metrics.radius.full,
			flexDirection: "row",
			alignItems: "center",
			gap: metrics.sm,
		},
		buttonText: {
			color: colors.textInverse,
			fontSize: typography.sizes.sm,
			fontWeight: "600",
		},
	});

	return (
		<View style={styles.container}>
			<Ionicons
				name="alert-circle-outline"
				size={64}
				color={colors.error || "#EF4444"}
				style={styles.icon}
			/>
			<Text style={styles.title}>Something went wrong</Text>
			<Text style={styles.subtitle}>
				We apologize for the inconvenience. Please try again.
			</Text>
			{error && (
				<View style={styles.errorDetails}>
					<Text style={styles.errorText}>
						{error.message.slice(0, 200)}
					</Text>
				</View>
			)}
			<Pressable onPress={onReset} style={styles.button}>
				<Ionicons name="refresh-outline" size={20} color={colors.textInverse} />
				<Text style={styles.buttonText}>Try Again</Text>
			</Pressable>
		</View>
	);
}

// Wrapper for screens with specific error handling
export function ScreenErrorBoundary({
	children,
	screenName,
}: {
	children: ReactNode;
	screenName?: string;
}) {
	return (
		<ErrorBoundaryClass
			onError={(error, errorInfo) => {
				console.error(`[ScreenErrorBoundary:${screenName || "unknown"}]`, {
					error: error.message,
					componentStack: errorInfo.componentStack,
				});
			}}
		>
			{children}
		</ErrorBoundaryClass>
	);
}

// Specialized error boundary for chat screens
export function ChatErrorBoundary({ children }: { children: ReactNode }) {
	return (
		<ErrorBoundaryClass
			onError={(error, errorInfo) => {
				console.error("[ChatErrorBoundary] Chat screen crashed:", {
					error: error.message,
					componentStack: errorInfo.componentStack,
				});
			}}
		>
			{children}
		</ErrorBoundaryClass>
	);
}

export default ErrorBoundaryClass;
