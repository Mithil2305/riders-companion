/**
 * Utility functions for formatting data
 */

/**
 * Format a date to a readable string
 */
export function formatDate(date: Date | string): string {
<<<<<<< HEAD
=======
<<<<<<< HEAD
  const d = new Date(date);
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
=======
>>>>>>> f6515781ad9de8db79994bdc067ba0a02e47799f
	const d = new Date(date);
	return d.toLocaleDateString("en-US", {
		year: "numeric",
		month: "short",
		day: "numeric",
	});
<<<<<<< HEAD
=======
>>>>>>> cb3f167d96cf0daedb34e800dcf9590b155e87c0
>>>>>>> f6515781ad9de8db79994bdc067ba0a02e47799f
}

/**
 * Format a date with time
 */
export function formatDateTime(date: Date | string): string {
<<<<<<< HEAD
=======
<<<<<<< HEAD
  const d = new Date(date);
  return d.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
=======
>>>>>>> f6515781ad9de8db79994bdc067ba0a02e47799f
	const d = new Date(date);
	return d.toLocaleString("en-US", {
		year: "numeric",
		month: "short",
		day: "numeric",
		hour: "2-digit",
		minute: "2-digit",
	});
<<<<<<< HEAD
=======
>>>>>>> cb3f167d96cf0daedb34e800dcf9590b155e87c0
>>>>>>> f6515781ad9de8db79994bdc067ba0a02e47799f
}

/**
 * Format time ago (e.g., "2 hours ago")
 */
export function formatTimeAgo(date: Date | string): string {
<<<<<<< HEAD
	const timestamp = new Date(date).getTime();
	if (!Number.isFinite(timestamp)) {
		return "Just now";
	}
=======
<<<<<<< HEAD
  const timestamp = new Date(date).getTime();
  if (!Number.isFinite(timestamp)) {
    return 'Just now';
  }
>>>>>>> f6515781ad9de8db79994bdc067ba0a02e47799f

	const elapsedSeconds = Math.max(
		0,
		Math.floor((Date.now() - timestamp) / 1000),
	);
	if (elapsedSeconds < 60) {
		return elapsedSeconds <= 1 ? "Just now" : `${elapsedSeconds} seconds ago`;
	}

	const elapsedMinutes = Math.floor(elapsedSeconds / 60);
	if (elapsedMinutes < 60) {
		return elapsedMinutes === 1
			? "1 minute ago"
			: `${elapsedMinutes} minutes ago`;
	}

	const elapsedHours = Math.floor(elapsedMinutes / 60);
	if (elapsedHours < 24) {
		return elapsedHours === 1 ? "1 hour ago" : `${elapsedHours} hours ago`;
	}

	const elapsedDays = Math.floor(elapsedHours / 24);
	if (elapsedDays < 30) {
		return elapsedDays === 1 ? "1 day ago" : `${elapsedDays} days ago`;
	}

	const elapsedMonths = Math.floor(elapsedDays / 30);
	if (elapsedMonths < 12) {
		return elapsedMonths === 1 ? "1 month ago" : `${elapsedMonths} months ago`;
	}

	const elapsedYears = Math.floor(elapsedDays / 365);
	return elapsedYears === 1 ? "1 year ago" : `${elapsedYears} years ago`;
}

export function formatCompactTimeAgo(date: Date | string): string {
	const timestamp = new Date(date).getTime();
	if (!Number.isFinite(timestamp)) {
		return "1m ago";
	}

	const elapsedMinutes = Math.max(
		1,
		Math.floor((Date.now() - timestamp) / 60000),
	);
	if (elapsedMinutes < 60) {
		return `${elapsedMinutes}m ago`;
	}

	const elapsedHours = Math.floor(elapsedMinutes / 60);
	if (elapsedHours < 24) {
		return `${elapsedHours}h ago`;
	}

<<<<<<< HEAD
=======
  const elapsedDays = Math.floor(elapsedHours / 24);
  return `${elapsedDays}d ago`;
=======
	const timestamp = new Date(date).getTime();
	if (!Number.isFinite(timestamp)) {
		return "Just now";
	}

	const elapsedSeconds = Math.max(
		0,
		Math.floor((Date.now() - timestamp) / 1000),
	);
	if (elapsedSeconds < 60) {
		return elapsedSeconds <= 1 ? "Just now" : `${elapsedSeconds} seconds ago`;
	}

	const elapsedMinutes = Math.floor(elapsedSeconds / 60);
	if (elapsedMinutes < 60) {
		return elapsedMinutes === 1
			? "1 minute ago"
			: `${elapsedMinutes} minutes ago`;
	}

	const elapsedHours = Math.floor(elapsedMinutes / 60);
	if (elapsedHours < 24) {
		return elapsedHours === 1 ? "1 hour ago" : `${elapsedHours} hours ago`;
	}

	const elapsedDays = Math.floor(elapsedHours / 24);
	if (elapsedDays < 30) {
		return elapsedDays === 1 ? "1 day ago" : `${elapsedDays} days ago`;
	}

	const elapsedMonths = Math.floor(elapsedDays / 30);
	if (elapsedMonths < 12) {
		return elapsedMonths === 1 ? "1 month ago" : `${elapsedMonths} months ago`;
	}

	const elapsedYears = Math.floor(elapsedDays / 365);
	return elapsedYears === 1 ? "1 year ago" : `${elapsedYears} years ago`;
}

export function formatCompactTimeAgo(date: Date | string): string {
	const timestamp = new Date(date).getTime();
	if (!Number.isFinite(timestamp)) {
		return "1m ago";
	}

	const elapsedMinutes = Math.max(
		1,
		Math.floor((Date.now() - timestamp) / 60000),
	);
	if (elapsedMinutes < 60) {
		return `${elapsedMinutes}m ago`;
	}

	const elapsedHours = Math.floor(elapsedMinutes / 60);
	if (elapsedHours < 24) {
		return `${elapsedHours}h ago`;
	}

>>>>>>> f6515781ad9de8db79994bdc067ba0a02e47799f
	const elapsedDays = Math.floor(elapsedHours / 24);
	return `${elapsedDays}d ago`;
}

export function formatRelativeTimeShort(date: Date | string): string {
	const timestamp = new Date(date).getTime();
	if (!Number.isFinite(timestamp)) {
		return "Just now";
	}

	const elapsedSeconds = Math.max(
		0,
		Math.floor((Date.now() - timestamp) / 1000),
	);
	if (elapsedSeconds < 60) {
		return "Just now";
	}

	const elapsedMinutes = Math.floor(elapsedSeconds / 60);
	if (elapsedMinutes < 60) {
		return `${elapsedMinutes}min ago`;
	}

	const elapsedHours = Math.floor(elapsedMinutes / 60);
	if (elapsedHours < 24) {
		return `${elapsedHours}hr${elapsedHours === 1 ? "" : "s"} ago`;
	}

	const elapsedDays = Math.floor(elapsedHours / 24);
	if (elapsedDays < 30) {
		return `${elapsedDays}day${elapsedDays === 1 ? "" : "s"} ago`;
	}

	const elapsedMonths = Math.floor(elapsedDays / 30);
	if (elapsedMonths < 12) {
		return `${elapsedMonths}mo ago`;
	}

	const elapsedYears = Math.floor(elapsedDays / 365);
	return `${elapsedYears}yr${elapsedYears === 1 ? "" : "s"} ago`;
<<<<<<< HEAD
=======
>>>>>>> cb3f167d96cf0daedb34e800dcf9590b155e87c0
>>>>>>> f6515781ad9de8db79994bdc067ba0a02e47799f
}

/**
 * Format distance in km or miles
 */
export function formatDistance(meters: number): string {
<<<<<<< HEAD
=======
<<<<<<< HEAD
  if (meters < 1000) {
    return `${Math.round(meters)} m`;
  }
  return `${(meters / 1000).toFixed(1)} km`;
=======
>>>>>>> f6515781ad9de8db79994bdc067ba0a02e47799f
	if (meters < 1000) {
		return `${Math.round(meters)} m`;
	}
	return `${(meters / 1000).toFixed(1)} km`;
<<<<<<< HEAD
=======
>>>>>>> cb3f167d96cf0daedb34e800dcf9590b155e87c0
>>>>>>> f6515781ad9de8db79994bdc067ba0a02e47799f
}

/**
 * Format duration in hours, minutes
 */
export function formatDuration(seconds: number): string {
<<<<<<< HEAD
=======
<<<<<<< HEAD
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
=======
>>>>>>> f6515781ad9de8db79994bdc067ba0a02e47799f
	const hours = Math.floor(seconds / 3600);
	const minutes = Math.floor((seconds % 3600) / 60);

	if (hours > 0) {
		return `${hours}h ${minutes}m`;
	}
	return `${minutes}m`;
<<<<<<< HEAD
=======
>>>>>>> cb3f167d96cf0daedb34e800dcf9590b155e87c0
>>>>>>> f6515781ad9de8db79994bdc067ba0a02e47799f
}

/**
 * Format speed
 */
export function formatSpeed(mps: number): string {
<<<<<<< HEAD
	const kmh = mps * 3.6;
	return `${kmh.toFixed(1)} km/h`;
=======
<<<<<<< HEAD
  const kmh = mps * 3.6;
  return `${kmh.toFixed(1)} km/h`;
=======
	const kmh = mps * 3.6;
	return `${kmh.toFixed(1)} km/h`;
>>>>>>> cb3f167d96cf0daedb34e800dcf9590b155e87c0
>>>>>>> f6515781ad9de8db79994bdc067ba0a02e47799f
}

/**
 * Truncate text with ellipsis
 */
export function truncateText(text: string, maxLength: number): string {
<<<<<<< HEAD
	if (text.length <= maxLength) return text;
	return text.substring(0, maxLength) + "...";
=======
<<<<<<< HEAD
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
=======
	if (text.length <= maxLength) return text;
	return text.substring(0, maxLength) + "...";
>>>>>>> cb3f167d96cf0daedb34e800dcf9590b155e87c0
>>>>>>> f6515781ad9de8db79994bdc067ba0a02e47799f
}

/**
 * Format number with commas
 */
export function formatNumber(num: number): string {
<<<<<<< HEAD
	return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
=======
<<<<<<< HEAD
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
=======
	return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
>>>>>>> cb3f167d96cf0daedb34e800dcf9590b155e87c0
>>>>>>> f6515781ad9de8db79994bdc067ba0a02e47799f
}
