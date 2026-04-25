import { ClipItem } from "../../types/clips";

export const mockClips: ClipItem[] = [
	{
		id: "1",
		user: "adventure_seeker",
		avatar: "https://i.pravatar.cc/150?img=32",
		media: "https://picsum.photos/seed/clip-1/1080/1920",
		createdAt: "2026-04-24T08:30:00.000Z",
		caption:
			"Group ride with the crew! 15 riders, 300 miles, unforgettable memories 🏍️ #RideLife",
		likes: 2200,
		comments: 234,
		shares: 89,
		music: "Riders Anthem · DJ Torque",
	},
	{
		id: "2",
		user: "riderx",
		avatar: "https://i.pravatar.cc/150?img=33",
		media: "https://picsum.photos/seed/clip-2/1080/1920",
		createdAt: "2026-04-23T06:15:00.000Z",
		caption:
			"Sunrise throttle and clean corners. Best way to start the day. #MorningRide",
		likes: 1580,
		comments: 112,
		shares: 57,
		music: "Sun Chaser · Night Riders",
	},
	{
		id: "3",
		user: "speedking",
		avatar: "https://i.pravatar.cc/150?img=34",
		media: "https://picsum.photos/seed/clip-3/1080/1920",
		createdAt: "2026-04-22T17:45:00.000Z",
		caption: "Track session highlights. Smooth lines, smooth mind.",
		likes: 3050,
		comments: 410,
		shares: 146,
		music: "Redline Dreams · Aero",
	},
];
