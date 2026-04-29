import React from 'react';
import RideService from '../services/RideService';

interface UseRideLocationSuggestionsResult {
	suggestions: string[];
	isSearching: boolean;
}

const MIN_QUERY_LENGTH = 3;
const SEARCH_DEBOUNCE_MS = 320;

export function useRideLocationSuggestions(
	query: string,
): UseRideLocationSuggestionsResult {
	const [suggestions, setSuggestions] = React.useState<string[]>([]);
	const [isSearching, setIsSearching] = React.useState(false);

	React.useEffect(() => {
		const normalized = query.trim();

		if (normalized.length < MIN_QUERY_LENGTH) {
			setSuggestions([]);
			setIsSearching(false);
			return;
		}

		let cancelled = false;
		setIsSearching(true);

		const timer = setTimeout(() => {
			RideService.searchLocations(normalized)
				.then((items) => {
					if (cancelled) {
						return;
					}
					setSuggestions(items);
				})
				.catch(() => {
					if (cancelled) {
						return;
					}
					setSuggestions([]);
				})
				.finally(() => {
					if (cancelled) {
						return;
					}
					setIsSearching(false);
				});
		}, SEARCH_DEBOUNCE_MS);

		return () => {
			cancelled = true;
			clearTimeout(timer);
		};
	}, [query]);

	return {
		suggestions,
		isSearching,
	};
}
