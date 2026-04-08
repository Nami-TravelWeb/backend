const Joi = require("joi");
const { Admins, Posts, Locations, Hashtags } = require("../models");
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

exports.createPost = async (req, res, next) => {
	const schema = Joi.object({
		title: Joi.string().required().messages({
			"string.base": "標題必須是字串",
			"string.empty": "標題不能為空",
			"any.required": "標題是必填欄位",
		}),
		locationId: Joi.number().integer().required().messages({
			"number.base": "地點ID必須是數字",
			"number.empty": "地點ID不能為空",
			"any.required": "地點ID是必填欄位",
		}),
		city: Joi.string().required().messages({
			"string.base": "城市必須是字串",
			"string.empty": "城市不能為空",
			"any.required": "城市是必填欄位",
		}),
		content: Joi.string().required().messages({
			"string.base": "內容必須是字串",
			"string.empty": "內容不能為空",
			"any.required": "內容是必填欄位",
		}),
		spots: Joi.object().required().messages({
			"object.base": "要跳轉的點必須是物件",
			"object.empty": "要跳轉的點不能為空",
			"any.required": "要跳轉的點是必填欄位",
		}),
		isPublished: Joi.boolean().required().messages({
			"boolean.base": "是否發布必須是布林值",
			"boolean.empty": "是否發布不能為空",
			"any.required": "是否發布是必填欄位",
		}),
		mainImageUrl: Joi.string().required().messages({
			"string.base": "主圖片URL必須是字串",
			"string.empty": "主圖片URL不能為空",
			"any.required": "主圖片URL是必填欄位",
		}),
	});
	const { error, value } = schema.validate(req.body);
	if (error) {
		return res
			.status(400)
			.json({ message: "資料格式錯誤", error: error.details[0].message });
	}
	const {
		title,
		locationId,
		city,
		content,
		spots,
		isPublished,
		mainImageUrl,
	} = value;

	try {
		const location = await Locations.findOne({ where: { id: locationId } });
		if (!location) {
			return res.status(404).json({ message: "國家/地區不存在" });
		}

		const post = await Posts.create({
			title,
			location: locationId,
			city,
			content,
			spots,
			isPublished,
			mainImageUrl,
		});

		return res.status(200).json({ message: "success", post });
	} catch (err) {
		next(err);
	}
};

exports.createPostHashtags = async (req, res, next) => {};

exports.getLocations = async (req, res, next) => {
	const schema = Joi.object({
		continent: Joi.string().optional().messages({
			"string.base": "國家/地區必須是字串",
			"string.empty": "國家/地區不能為空",
			"any.required": "國家/地區是必填欄位",
		}),
	});
	const { error, value } = schema.validate(req.query);
	if (error) {
		return res
			.status(400)
			.json({ message: "資料格式錯誤", error: error.details[0].message });
	}
	const { continent } = value;

	try {
		const whereClause = {};
		if (continent) {
			whereClause.continent = continent;
		}
		const locations = await Locations.findAll({
			attributes: ["id", "continent", "region", "country"],
			where: whereClause,
		});
		return res.status(200).json({ message: "success", locations });
	} catch (err) {
		next(err);
	}
};

exports.createLocation = async (req, res, next) => {
	const schema = Joi.object({
		continent: Joi.string().required().messages({
			"string.base": "國家/地區必須是字串",
			"string.empty": "國家/地區不能為空",
			"any.required": "國家/地區是必填欄位",
		}),
		region: Joi.string().required().messages({
			"string.base": "地區必須是字串",
			"string.empty": "地區不能為空",
			"any.required": "地區是必填欄位",
		}),
		country: Joi.string().required().messages({
			"string.base": "國家必須是字串",
			"string.empty": "國家不能為空",
			"any.required": "國家是必填欄位",
		}),
	});
	const { error, value } = schema.validate(req.body);
	if (error) {
		return res
			.status(400)
			.json({ message: "資料格式錯誤", error: error.details[0].message });
	}
	const { continent, region, country } = value;
	try {
		const location = await Locations.findOne({
			where: { country },
		});
		if (location) {
			return res.status(400).json({ message: "國家已存在" });
		}
		await Locations.create({ continent, region, country });
		return res.status(200).json({ message: "success" });
	} catch (err) {
		next(err);
	}
};

exports.updateLocation = async (req, res, next) => {
	const schema = Joi.object({
		locationId: Joi.number().integer().required().messages({
			"number.base": "id必須是數字",
			"number.empty": "id不能為空",
			"any.required": "id是必填欄位",
		}),
		continent: Joi.string().optional().messages({
			"string.base": "國家/地區必須是字串",
			"string.empty": "國家/地區不能為空",
			"any.required": "國家/地區是必填欄位",
		}),
		region: Joi.string().optional().messages({
			"string.base": "地區必須是字串",
			"string.empty": "地區不能為空",
			"any.required": "地區是必填欄位",
		}),
		country: Joi.string().optional().messages({
			"string.base": "國家必須是字串",
			"string.empty": "國家不能為空",
			"any.required": "國家是必填欄位",
		}),
	});
	const { error, value } = schema.validate(req.body);
	if (error) {
		return res
			.status(400)
			.json({ message: "資料格式錯誤", error: error.details[0].message });
	}
	const { locationId, continent, region, country } = value;
	try {
		const location = await Locations.findOne({ where: { id: locationId } });
		if (!location) {
			return res.status(404).json({ message: "國家不存在" });
		}
		await location.update({ continent, region, country });
		return res.status(200).json({ message: "success" });
	} catch (err) {
		next(err);
	}
};

exports.deleteLocation = async (req, res, next) => {
	const schema = Joi.object({
		locationId: Joi.number().integer().required().messages({
			"number.base": "id必須是數字",
			"number.empty": "id不能為空",
			"any.required": "id是必填欄位",
		}),
	});
	const { error, value } = schema.validate(req.body);
	if (error) {
		return res
			.status(400)
			.json({ message: "資料格式錯誤", error: error.details[0].message });
	}
	const { locationId } = value;
	try {
		const location = await Locations.findOne({ where: { id: locationId } });
		if (!location) {
			return res.status(404).json({ message: "國家/地區不存在" });
		}
		await location.destroy();
		return res.status(200).json({ message: "success" });
	} catch (err) {
		next(err);
	}
};

exports.getHashTags = async (req, res, next) => {
	try {
		const hashtags = await Hashtags.findAll({
			attributes: ["id", "name"],
		});
		return res.status(200).json({ message: "success", hashtags });
	} catch (err) {
		next(err);
	}
};

exports.createHashTag = async (req, res, next) => {
	const schema = Joi.object({
		name: Joi.string().required().messages({
			"string.base": "hashtag必須是字串",
			"string.empty": "hashtag不能為空",
			"any.required": "hashtag是必填欄位",
		}),
	});
	const { error, value } = schema.validate(req.body);
	if (error) {
		return res
			.status(400)
			.json({ message: "資料格式錯誤", error: error.details[0].message });
	}
	const { name } = value;

	try {
		const hashtag = await Hashtags.findOne({ where: { name } });
		if (hashtag) {
			return res.status(400).json({ message: "標籤已存在" });
		}
		await Hashtags.create({ name });
		return res.status(200).json({ message: "success" });
	} catch (err) {
		next(err);
	}
};

exports.deleteHashTag = async (req, res, next) => {
	const schema = Joi.object({
		hashtagId: Joi.number().integer().required().messages({
			"number.base": "id必須是數字",
			"number.empty": "id不能為空",
			"any.required": "id是必填欄位",
		}),
	});
	const { error, value } = schema.validate(req.body);
	if (error) {
		return res
			.status(400)
			.json({ message: "資料格式錯誤", error: error.details[0].message });
	}
	const { hashtagId } = value;

	try {
		const hashtag = await Hashtags.findOne({ where: { id: hashtagId } });
		if (!hashtag) {
			return res.status(404).json({ message: "標籤不存在" });
		}
		await Hashtags.destroy({ where: { id: hashtagId } });
		return res.status(200).json({ message: "已刪除標籤" });
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
