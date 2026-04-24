let sendToRiderHandler = null;

const setSendToRiderHandler = (handler) => {
	sendToRiderHandler = typeof handler === "function" ? handler : null;
};

const sendToRider = (riderId, type, payload = {}) => {
	if (!sendToRiderHandler) {
		return;
	}

	sendToRiderHandler(riderId, type, payload);
};

module.exports = {
	setSendToRiderHandler,
	sendToRider,
};
