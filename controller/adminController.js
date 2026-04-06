const Joi = require("joi");
const { Admins, Posts } = require("../models");
const jwt = require("jsonwebtoken");

exports.adminLogin = async (req, res, next) => {
	const schema = Joi.object({
		account: Joi.string().required().messages({
			"string.base": "帳號必須是字串",
			"string.empty": "帳號不能為空",
			"any.required": "帳號是必填欄位",
		}),
		password: Joi.string().required().messages({
			"string.base": "密碼必須是字串",
			"string.empty": "密碼不能為空",
			"any.required": "密碼是必填欄位",
		}),
	});
	const { error, value } = schema.validate(req.body);
	const { account, password } = value;

	if (error) {
		return res.status(400).json({
			message: "資料格式錯誤",
			error: error.details[0].message,
		});
	}

	try {
		const admin = await Admins.findOne({ where: { account } });

		if (!admin) {
			return res.status(404).json({ message: "帳號不存在" });
		}

		if (password !== admin.password) {
			return res.status(401).json({ message: "密碼錯誤" });
		}

		const jwtToken = jwt.sign(
			{ account: admin.account, userId: admin.id },
			process.env.JWT_SECRETKEY,
			{ expiresIn: "30d" },
		);

		return res.status(200).json({ message: "登入成功", jwtToken });
	} catch (err) {
		next(err);
	}
};

exports.getPosts = async (req, res, next) => {
	try {
		const posts = await Posts.findAll();
		return res.status(200).json({ message: "success", posts });
	} catch (err) {
		next(err);
	}
};
