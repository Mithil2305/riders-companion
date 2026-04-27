import React from "react";
import InteractionService from "../services/InteractionService";
import { ShareTargetType, ShareUser } from "../types/interactions";
import { useAuth } from "../contexts/AuthContext";

export function useShare(
	postId: string,
	postUrl?: string,
	resourceType: "post" | "clip" = "post",
	preview?: {
		title?: string;
		caption?: string;
		thumbnailUrl?: string;
	},
) {
	const { user } = useAuth();
	const [query, setQuery] = React.useState("");
	const [users, setUsers] = React.useState<ShareUser[]>([]);
	const [isLoading, setIsLoading] = React.useState(false);
	const [isSharing, setIsSharing] = React.useState(false);

	const getShareUsers = React.useCallback(async (nextQuery: string = "") => {
		setIsLoading(true);
		try {
			const items = await InteractionService.getShareUsers(nextQuery);
			setUsers(items);
		} catch {
			setUsers([]);
		} finally {
			setIsLoading(false);
		}
	}, []);

	React.useEffect(() => {
		void getShareUsers("");
	}, [getShareUsers, postId]);

	const shareToUser = React.useCallback(
		async (userId: string) => {
			if (!postId) {
				return;
			}

			setIsSharing(true);
			try {
				await InteractionService.shareToUserAsMessage({
					userId,
					resourceType,
					resourceId: postId,
					title: preview?.title,
					caption: preview?.caption,
					thumbnailUrl: preview?.thumbnailUrl,
					senderId: user?.id,
					senderName: user?.name || user?.username || "Rider",
				});
			} finally {
				setIsSharing(false);
			}
		},
		[
			postId,
			preview?.caption,
			preview?.thumbnailUrl,
			preview?.title,
			resourceType,
			user?.id,
			user?.name,
			user?.username,
		],
	);

	const shareToAction = React.useCallback(
		async (target: ShareTargetType) => {
			setIsSharing(true);
			try {
				await InteractionService.shareToAction(target, postUrl, postId);
			} finally {
				setIsSharing(false);
			}
		},
		[postId, postUrl],
	);

	const copyLink = React.useCallback(async () => {
		setIsSharing(true);
		try {
			await InteractionService.copyLink(postUrl, postId);
		} finally {
			setIsSharing(false);
		}
	}, [postId, postUrl]);

	return {
		query,
		setQuery,
		users,
		isLoading,
		isSharing,
		getShareUsers,
		shareToUser,
		shareToAction,
		copyLink,
	};
}
