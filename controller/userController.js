exports.getUser = async (req, res, next) => {
	try {
		return res.status(200).json({ message: "get user success" });
	} catch (error) {
		return res.status(500).json({ message: "get user failed" });
	}
};
