import React from "react";
import InteractionService from "../services/InteractionService";
import { ShareTargetType, ShareUser } from "../types/interactions";

export function useShare(postId: string, postUrl?: string) {
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

	const shareToUser = React.useCallback(async (userId: string) => {
		setIsSharing(true);
		try {
			await InteractionService.shareToUser(userId);
		} finally {
			setIsSharing(false);
		}
	}, []);

	const shareToAction = React.useCallback(
		async (target: ShareTargetType) => {
			setIsSharing(true);
			try {
				await InteractionService.shareToAction(target, postUrl);
			} finally {
				setIsSharing(false);
			}
		},
		[postUrl],
	);

	const copyLink = React.useCallback(async () => {
		setIsSharing(true);
		try {
			await InteractionService.copyLink(postUrl);
		} finally {
			setIsSharing(false);
		}
	}, [postUrl]);

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
