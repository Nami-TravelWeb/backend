exports.adminLogin = async (req, res, next) => {
	try {
		const { account, password } = req.body;
	} catch (error) {
		return res.status(500).json({ message: "admin login failed" });
	}
};
