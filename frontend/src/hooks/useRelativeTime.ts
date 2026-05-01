import React from "react";
import { formatRelativeTimeShort } from "../utils/formatters";

const MINUTE_MS = 60 * 1000;
const SECOND_MS = 1000;

const resolveNextDelay = (timestamp: number) => {
	if (!Number.isFinite(timestamp)) {
		return MINUTE_MS;
	}

	const elapsedSeconds = Math.max(
		0,
		Math.floor((Date.now() - timestamp) / 1000),
	);

	if (elapsedSeconds < 60) {
		return SECOND_MS;
	}

	const remainder = elapsedSeconds % 60;
	return (60 - remainder) * 1000;
};

export function useRelativeTime(date: Date | string): string {
	const [label, setLabel] = React.useState(() => formatRelativeTimeShort(date));

	React.useEffect(() => {
		const timestamp = new Date(date).getTime();
		let timeoutId: ReturnType<typeof setTimeout> | null = null;

		const scheduleUpdate = () => {
			setLabel(formatRelativeTimeShort(date));
			timeoutId = setTimeout(scheduleUpdate, resolveNextDelay(timestamp));
		};

		scheduleUpdate();

		return () => {
			if (timeoutId) {
				clearTimeout(timeoutId);
			}
		};
	}, [date]);

	return label;
}
