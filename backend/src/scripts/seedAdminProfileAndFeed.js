require("dotenv").config();

const { sequelize, RiderAccount, FeedPost } = require("../models");

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@rider.com";

const SAMPLE_PROFILE = {
	name: process.env.ADMIN_NAME || "Admin Rider",
	bio: "Road captain, mountain rider, and community mentor. This is a seeded profile for local testing.",
	mobile_number: process.env.ADMIN_MOBILE || "+910000000000",
	driver_license_number: process.env.ADMIN_LICENSE || "DL-ADMIN-SEED-0001",
	profile_image_url:
		process.env.ADMIN_PROFILE_IMAGE_URL ||
		"https://images.unsplash.com/photo-1521412644187-c49fa049e84d?auto=format&fit=crop&w=400&q=80",
	banner_image_url:
		process.env.ADMIN_BANNER_IMAGE_URL ||
		"https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1400&q=80",
	total_miles: Number(process.env.ADMIN_TOTAL_MILES || 30250),
};

const SAMPLE_POSTS = [
	{
		caption: "[seed] Sunrise canyon ride. #morning #mountains",
		media_url:
			"https://images.unsplash.com/photo-1558981359-219d6364c9c8?auto=format&fit=crop&w=1200&q=80",
		media_type: "IMAGE",
	},
	{
		caption: "[seed] Weekend story update from the trail.",
		media_url:
			"https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=1200&q=80",
		media_type: "STORY",
	},
	{
		caption: "[seed] Twisties run clip drop.",
		media_url:
			"https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4",
		media_type: "VIDEO",
	},
];

async function run() {
	try {
		await sequelize.authenticate();

		const adminUser = await RiderAccount.findOne({
			where: { email: ADMIN_EMAIL },
		});
		if (!adminUser) {
			throw new Error(
				`No rider_account found for ${ADMIN_EMAIL}. Run npm run seed:admin first.`,
			);
		}

		await adminUser.update({
			...SAMPLE_PROFILE,
			profile_setup_completed_at:
				adminUser.profile_setup_completed_at || new Date(),
		});

		for (const post of SAMPLE_POSTS) {
			const existing = await FeedPost.findOne({
				where: {
					rider_id: adminUser.id,
					caption: post.caption,
				},
			});

			if (existing) {
				await existing.update({
					media_url: post.media_url,
					media_type: post.media_type,
				});
				continue;
			}

			await FeedPost.create({
				rider_id: adminUser.id,
				caption: post.caption,
				media_url: post.media_url,
				media_type: post.media_type,
			});
		}

		console.log(
			`Admin sample profile and feed seeded for ${ADMIN_EMAIL} (rider_id: ${adminUser.id}).`,
		);
		process.exit(0);
	} catch (error) {
		console.error("Failed to seed admin sample profile/feed:", error.message);
		process.exit(1);
	}
}

run();
