export type GroupChatItem =
	| {
			id: string;
			kind: "system";
			text: string;
	  }
	| {
			id: string;
			kind: "incoming";
			senderName: string;
			message: string;
			avatar: string;
			time: string;
	  }
	| {
			id: string;
			kind: "incoming-location";
			senderName: string;
			message: string;
			avatar: string;
			time: string;
			locationLabel: string;
	  }
	| {
			id: string;
			kind: "outgoing";
			message: string;
			time: string;
	  };

export type RiderLocation = {
	riderId: string;
	name: string;
	latitude: number;
	longitude: number;
	updatedAt: string;
};

export type GroupRideMember = {
	id: string;
	name: string;
	username?: string | null;
	avatar?: string | null;
	bio?: string | null;
	status?: string;
	isOrganizer?: boolean;
	isFollowing?: boolean;
};
