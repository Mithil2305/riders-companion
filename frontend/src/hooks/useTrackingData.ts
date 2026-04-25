import React from "react";
import { TrackerUser } from "../types/profile";
import ProfileService from "../services/ProfileService";
import TrackerService from "../services/TrackerService";

export type TrackingTabKey = "followers" | "following";

interface UseTrackingDataResult {
	loading: boolean;
	refreshing: boolean;
	activeTab: TrackingTabKey;
	followers: TrackerUser[];
	following: TrackerUser[];
	setActiveTab: (nextTab: TrackingTabKey) => void;
	toggleFollowState: (userId: string) => void;
	refreshTracking: () => Promise<void>;
}

const FALLBACK_AVATAR = "https://i.pravatar.cc/100";

const toTrackerUser = (value: unknown): TrackerUser | null => {
	if (!value || typeof value !== "object") {
		return null;
	}

	const record = value as {
		id?: unknown;
		name?: unknown;
		username?: unknown;
		avatar?: unknown;
		profileImageUrl?: unknown;
		isFollowing?: unknown;
	};

	if (typeof record.id !== "string" || record.id.length === 0) {
		return null;
	}

	const name =
		typeof record.name === "string" && record.name.length > 0
			? record.name
			: typeof record.username === "string" && record.username.length > 0
				? `@${record.username}`
				: "Rider";
	const avatar =
		typeof record.avatar === "string" && record.avatar.length > 0
			? record.avatar
			: typeof record.profileImageUrl === "string" &&
				  record.profileImageUrl.length > 0
				? record.profileImageUrl
				: FALLBACK_AVATAR;

	return {
		id: record.id,
		name,
		avatar,
		isFollowing: Boolean(record.isFollowing),
	};
};

export function useTrackingData(
	initialTab: TrackingTabKey,
): UseTrackingDataResult {
	const [loading, setLoading] = React.useState(true);
	const [refreshing, setRefreshing] = React.useState(false);
	const [activeTab, setActiveTab] = React.useState<TrackingTabKey>(initialTab);
	const [followers, setFollowers] = React.useState<TrackerUser[]>([]);
	const [following, setFollowing] = React.useState<TrackerUser[]>([]);

	const loadTracking = React.useCallback(async () => {
		const profileData = await ProfileService.getMyProfile();
		const riderId = profileData.profile.id;
		const [followersData, followingData] = await Promise.all([
			TrackerService.getFollowers(riderId),
			TrackerService.getFollowing(riderId),
		]);

		setFollowers(
			followersData.followers
				.map(toTrackerUser)
				.filter((item): item is TrackerUser => item != null),
		);
		setFollowing(
			followingData.following
				.map(toTrackerUser)
				.filter((item): item is TrackerUser => item != null),
		);
	}, []);

	React.useEffect(() => {
		let mounted = true;

		const run = async () => {
			try {
				await loadTracking();
			} finally {
				if (mounted) {
					setLoading(false);
				}
			}
		};

		void run();

		return () => {
			mounted = false;
		};
	}, [loadTracking]);

	const toggleFollowState = React.useCallback((userId: string) => {
		const user =
			followers.find((item) => item.id === userId) ??
			following.find((item) => item.id === userId);
		const nextFollowing = !user?.isFollowing;

		setFollowers((prev) =>
			prev.map((user) =>
				user.id === userId
					? { ...user, isFollowing: nextFollowing }
					: user,
			),
		);

		setFollowing((prev) =>
			prev.map((user) =>
				user.id === userId
					? { ...user, isFollowing: nextFollowing }
					: user,
			),
		);

		void (async () => {
			try {
				if (nextFollowing) {
					await TrackerService.followRider(userId);
				} else {
					await TrackerService.unfollowRider(userId);
				}
				await loadTracking();
			} catch {
				setFollowers((prev) =>
					prev.map((user) =>
						user.id === userId
							? { ...user, isFollowing: !nextFollowing }
							: user,
					),
				);
				setFollowing((prev) =>
					prev.map((user) =>
						user.id === userId
							? { ...user, isFollowing: !nextFollowing }
							: user,
					),
				);
			}
		})();
	}, [followers, following, loadTracking]);

	const refreshTracking = React.useCallback(async () => {
		setRefreshing(true);
		try {
			await loadTracking();
		} finally {
			setRefreshing(false);
		}
	}, [loadTracking]);

	return {
		loading,
		refreshing,
		activeTab,
		followers,
		following,
		setActiveTab,
		toggleFollowState,
		refreshTracking,
	};
}
