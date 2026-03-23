const jwt = require("jsonwebtoken");
const { Admins } = require("../models");
const moment = require("moment-timezone");

exports.authenticate = async (req, res, next) => {
	try {
		// 從請求標頭中提取 token
		const token =
			req.headers.authorization &&
			req.headers.authorization.split(" ")[1];
		if (!token) {
			return res.status(401).json({ message: "未授權" });
		}

		// 驗證 JWT 並解碼
		const decoded = jwt.verify(token, process.env.JWT_SECRETKEY);

		// 查詢 Admin，排除敏感欄位 (accountPw)
		const admin = await Admins.findOne({
			where: {
				id: decoded.userId,
			},
			raw: true,
		});

		// 如果 Admin 不存在或已被封禁，返回 401
		if (!admin) {
			return res.status(401).json({ message: "管理員不存" });
		}

		// 將 Admin 資料保存到 res.locals
		res.locals.myData = admin;

		next(); // 繼續執行下一個中間件
	} catch (error) {
		console.error(error);
		return res.status(401).json({ message: "授權錯誤" });
	}
};
