import React from "react";
import { Badge, GarageBike, ProfileUser } from "../types/profile";
import FeedService from "../services/FeedService";
import ProfileService from "../services/ProfileService";
import TrackerService from "../services/TrackerService";
import type { FeedPostPayload } from "../services/FeedService";

interface UseProfileDashboardDataResult {
	loading: boolean;
	user: ProfileUser;
	badges: Badge[];
	bikes: GarageBike[];
	moments: FeedPostPayload[];
	momentsCount: number;
	trackersCount: number;
	trackingCount: number;
	reloadDashboard: () => Promise<void>;
}

const FALLBACK_AVATAR =
	"https://images.unsplash.com/photo-1541534401786-2077eed87a72?auto=format&fit=crop&w=600&q=80";

const EMPTY_USER: ProfileUser = {
	name: "Rider",
	username: "rider",
	bio: "",
	miles: 0,
	avgSpeed: 0,
	rides: 0,
	avatar: FALLBACK_AVATAR,
	coverImage: FALLBACK_AVATAR,
};

export function useProfileDashboardData(): UseProfileDashboardDataResult {
	const [loading, setLoading] = React.useState(true);
	const [user, setUser] = React.useState<ProfileUser>(EMPTY_USER);
	const [badges] = React.useState<Badge[]>([]);
	const [bikes, setBikes] = React.useState<GarageBike[]>([]);
	const [moments, setMoments] = React.useState<FeedPostPayload[]>([]);
	const [momentsCount, setMomentsCount] = React.useState(0);
	const [trackersCount, setTrackersCount] = React.useState(0);
	const [trackingCount, setTrackingCount] = React.useState(0);
	const mountedRef = React.useRef(true);

	const loadDashboard = React.useCallback(async () => {
		setLoading(true);
		try {
			const profileData = await ProfileService.getMyProfile();
			if (!mountedRef.current) {
				return;
			}

			const profile = profileData.profile;
			const nextUser: ProfileUser = {
				name: profile.name,
				username: profile.username,
				bio: profile.bio ?? "",
				miles: Number(profile.totalMiles ?? 0),
				avgSpeed: 0,
				rides: 0,
				avatar: profile.profileImageUrl ?? FALLBACK_AVATAR,
				coverImage:
					profile.bannerImageUrl ?? profile.profileImageUrl ?? FALLBACK_AVATAR,
			};
			setUser(nextUser);

			setBikes(
				profileData.bikes.map((bike) => ({
					id: bike.id,
					brand: bike.brand,
					model: bike.model,
					year: bike.year,
					image: bike.bikeImageUrl ?? FALLBACK_AVATAR,
				})),
			);

			const feedData = await FeedService.getFeed();
			if (!mountedRef.current) {
				return;
			}

			const ownPosts = feedData.posts.filter(
				(post) =>
					post.rider?.id === profile.id &&
					typeof post.mediaUrl === "string" &&
					post.mediaUrl.length > 0,
			);
			setMoments(ownPosts);
			setMomentsCount(ownPosts.length);

			if (profile.id) {
				const [followers, following] = await Promise.all([
					TrackerService.getFollowers(profile.id),
					TrackerService.getFollowing(profile.id),
				]);

				if (!mountedRef.current) {
					return;
				}

				setTrackersCount(followers.followers.length);
				setTrackingCount(following.following.length);
			}
		} finally {
			if (mountedRef.current) {
				setLoading(false);
			}
		}
	}, []);

	React.useEffect(() => {
		mountedRef.current = true;
		void loadDashboard();

		return () => {
			mountedRef.current = false;
		};
	}, [loadDashboard]);

	return {
		loading,
		user,
		badges,
		bikes,
		moments,
		momentsCount,
		trackersCount,
		trackingCount,
		reloadDashboard: loadDashboard,
	};
}
