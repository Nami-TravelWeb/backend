const Joi = require("joi");
const {
	Admins,
	Posts,
	Locations,
	Hashtags,
	PostHashtags,
	sequelize,
} = require("../models");
const jwt = require("jsonwebtoken");
const { Op } = require("sequelize");
const moment = require("moment-timezone");
const { v4: uuidv4 } = require("uuid");
const { S3 } = require("aws-sdk");

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

exports.getPreSignedUrl = async (req, res, next) => {
	const schema = Joi.object({
		item: Joi.string().required().messages({
			"string.base": "item 格式錯誤",
			"any.required": "item 是必填欄位",
		}),
		id: Joi.number().integer().required().messages({
			"number.base": "id必須是數字",
			"number.empty": "id不能為空",
			"any.required": "id是必填欄位",
		}),
		mimeType: Joi.string().required().messages({
			"string.base": "mimeType 格式錯誤",
			"any.required": "mimeType 是必填欄位",
		}),
	});
	const { error, value } = schema.validate(req.body);
	if (error) {
		return res.status(400).json({ message: error.details[0].message });
	}
	const { item, id, mimeType } = value;

	try {
		const s3Params = {
			Bucket: process.env.AWS_S3_BUCKET_NAME,
			Key: `admin/${item}/${id}/${uuidv4()}`,
			Expires: 3600, // URL expires in 1 hour
			ContentType: mimeType,
		};
		const s3 = new S3({
			accessKeyId: process.env.AWS_IAM_ACCESS_KEY_ID,
			secretAccessKey: process.env.AWS_IAM_SECRET_ACCESS_KEY,
			region: process.env.AWS_S3_REGION,
			signatureVersion: "v4",
		});

		const preSignedUrl = await s3.getSignedUrlPromise(
			"putObject",
			s3Params,
		);
		return res.status(200).json({ preSignedUrl });
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
		mainImageUrl: Joi.string().optional().allow(null).messages({
			"string.base": "主圖片URL可以為字串",
			"string.empty": "主圖片URL可以為空",
			"any.required": "主圖片URL可以為空",
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

exports.getPosts = async (req, res, next) => {
	const schema = Joi.object({
		page: Joi.number().integer().default(1).messages({
			"number.base": "頁碼必須是數字",
			"number.empty": "頁碼不能為空",
			"any.required": "頁碼是必填欄位",
		}),
		limit: Joi.number().integer().default(50).messages({
			"number.base": "每頁筆數必須是數字",
			"number.empty": "每頁筆數不能為空",
			"any.required": "每頁筆數是必填欄位",
		}),
		isPublished: Joi.boolean().optional().messages({
			"boolean.base": "是否發布必須是布林值",
			"boolean.empty": "是否發布不能為空",
			"any.required": "是否發布是必填欄位",
		}),
		isDeleted: Joi.boolean().optional().messages({
			"boolean.base": "是否已刪除必須是布林值",
			"boolean.empty": "是否已刪除不能為空",
			"any.required": "是否已刪除是必填欄位",
		}),
		startDate: Joi.date().optional().allow("").messages({
			"date.base": "最大日期必須是日期",
			"date.empty": "最大日期不能為空",
			"any.required": "最大日期是必填欄位",
		}),
		endDate: Joi.date().optional().allow("").messages({
			"date.base": "最小日期必須是日期",
			"date.empty": "最小日期不能為空",
			"any.required": "最小日期是必填欄位",
		}),
		country: Joi.string().optional().messages({
			"string.base": "國家必須是字串",
			"string.empty": "國家不能為空",
			"any.required": "國家是必填欄位",
		}),
		city: Joi.string().optional().messages({
			"string.base": "城市必須是字串",
			"string.empty": "城市不能為空",
			"any.required": "城市是必填欄位",
		}),
		search: Joi.string().optional().allow("").messages({
			"string.base": "搜尋必須是字串",
			"string.empty": "搜尋不能為空",
			"any.required": "搜尋是必填欄位",
		}),
		order: Joi.number().integer().optional().messages({
			"number.base": "排序必須是數字",
			"number.empty": "排序不能為空",
			"any.required": "排序是必填欄位",
		}),
	});
	const { error, value } = schema.validate(req.query);
	if (error) {
		return res
			.status(400)
			.json({ message: "資料格式錯誤", error: error.details[0].message });
	}
	const {
		page,
		limit,
		isPublished,
		isDeleted,
		startDate,
		endDate,
		country,
		city,
		search,
		order,
	} = value;
	const offset = (page - 1) * limit;
	try {
		const whereClause = {};

		if (isPublished === true) {
			whereClause.isPublished = true;
			whereClause.deletedAt = null;
		} else if (isPublished === false) {
			whereClause.isPublished = false;
			whereClause.deletedAt = null;
		}
		if (isDeleted) {
			whereClause.deletedAt = { [Op.ne]: null };
		}
		if (startDate || endDate) {
			whereClause.createdAt = {};
			if (startDate) {
				whereClause.createdAt[Op.gte] = startDate;
			}
			if (endDate) {
				whereClause.createdAt[Op.lte] = moment(endDate)
					.endOf("day")
					.toDate();
			}
		}
		if (city) {
			whereClause.city = city;
		}
		if (search) {
			whereClause[Op.or] = [
				{ title: { [Op.like]: `%${search}%` } },

				{ city: { [Op.like]: `%${search}%` } },
				{
					id: {
						[Op.in]: sequelize.literal(`(
							SELECT p.id FROM Posts AS p
							INNER JOIN Locations AS l ON p.location = l.id
							WHERE l.country LIKE '%${search}%'
						)`),
					},
				},
				{
					id: {
						[Op.in]: sequelize.literal(`(
						SELECT ph.postId FROM PostHashtags AS ph
						INNER JOIN Hashtags AS h ON ph.hashtagId = h.id
						WHERE h.name LIKE '%${search}%'
						)`),
					},
				},
			];
		}

		const orderArray = [];

		if (order === 1) {
			orderArray.push(["createdAt", "DESC"]);
		} else if (order === 2) {
			orderArray.push(["createdAt", "ASC"]);
		} else if (order === 3) {
			orderArray.push(["viewCount", "DESC"]);
		} else if (order === 4) {
			orderArray.push(["updatedAt", "DESC"]);
		} else {
			orderArray.push(["createdAt", "DESC"]);
		}

		const { count, rows: posts } = await Posts.findAndCountAll({
			where: whereClause,
			include: [
				{
					model: Locations,
					as: "locationInfo",
					attributes: ["id", "continent", "region", "country"],
					where: country ? { country: country } : null,
				},
				{
					model: PostHashtags,
					as: "postHashtags",
					attributes: ["id", "postId", "hashtagId"],
					include: [
						{
							model: Hashtags,
							as: "hashtag",
							attributes: ["name"],
						},
					],
				},
			],
			offset,
			limit,
			order: orderArray,
			distinct: true,
			paranoid: false,
		});

		for (const post of posts) {
			delete post.dataValues.location;
		}
		return res.status(200).json({
			message: "success",
			posts,
			pagenation: {
				total: count,
				page,
				limit,
				totalPages: Math.ceil(count / limit),
			},
		});
	} catch (err) {
		next(err);
	}
};

exports.getPostById = async (req, res, next) => {
	const schema = Joi.object({
		postId: Joi.number().integer().required().messages({
			"number.base": "id必須是數字",
			"number.empty": "id不能為空",
			"any.required": "id是必填欄位",
		}),
	});
	const { error, value } = schema.validate(req.params);
	if (error) {
		return res
			.status(400)
			.json({ message: "資料格式錯誤", error: error.details[0].message });
	}
	const { postId } = value;
	try {
		const post = await Posts.findOne({
			include: [
				{
					model: Locations,
					as: "locationInfo",
					attributes: ["id", "continent", "region", "country"],
				},
				{
					model: PostHashtags,
					as: "postHashtags",
					attributes: ["id", "postId", "hashtagId"],
					include: [
						{
							model: Hashtags,
							as: "hashtag",
							attributes: ["name"],
						},
					],
				},
			],
			where: { id: postId },
		});
		if (!post) {
			return res.status(404).json({ message: "文章不存在" });
		}

		delete post.dataValues.location;

		return res.status(200).json({ message: "success", post });
	} catch (err) {
		next(err);
	}
};

exports.updatePost = async (req, res, next) => {
	const schema = Joi.object({
		postId: Joi.number().integer().required().messages({
			"number.base": "id必須是數字",
			"number.empty": "id不能為空",
			"any.required": "id是必填欄位",
		}),
		title: Joi.string().optional().messages({
			"string.base": "標題必須是字串",
			"string.empty": "標題不能為空",
			"any.required": "標題是必填欄位",
		}),
		locationId: Joi.number().integer().optional().messages({
			"number.base": "地點必須是數字",
			"number.empty": "地點不能為空",
			"any.required": "地點是必填欄位",
		}),
		city: Joi.string().optional().messages({
			"string.base": "城市必須是字串",
			"string.empty": "城市不能為空",
			"any.required": "城市是必填欄位",
		}),
		content: Joi.string().optional().messages({
			"string.base": "內容必須是字串",
			"string.empty": "內容不能為空",
			"any.required": "內容是必填欄位",
		}),
		spots: Joi.object().optional().messages({
			"object.base": "要跳轉的點必須是物件",
			"object.empty": "要跳轉的點不能為空",
			"any.required": "要跳轉的點是必填欄位",
		}),
		mainImageUrl: Joi.string().optional().allow(null).messages({
			"string.base": "主圖片URL可以為字串",
			"string.empty": "主圖片URL可以為空",
			"any.required": "主圖片URL可以為空",
		}),
	});
	const { error, value } = schema.validate(req.body);
	if (error) {
		return res
			.status(400)
			.json({ message: "資料格式錯誤", error: error.details[0].message });
	}
	const { postId, title, locationId, city, content, spots, mainImageUrl } =
		value;
	try {
		const post = await Posts.findOne({ where: { id: postId } });
		if (!post) {
			return res.status(404).json({ message: "文章不存在" });
		}

		const location = await Locations.findOne({ where: { id: locationId } });
		if (!location) {
			return res.status(404).json({ message: "地點不存在" });
		}

		await post.update({
			title,
			location: location.id,
			city,
			content,
			spots,
			mainImageUrl,
		});
		return res.status(200).json({ message: "更新文章成功", post });
	} catch (err) {
		next(err);
	}
};

exports.updateIsPublishedStatus = async (req, res, next) => {
	const schema = Joi.object({
		postId: Joi.number().integer().required().messages({
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
	const { postId } = value;
	try {
		const post = await Posts.findOne({ where: { id: postId } });
		if (!post) {
			return res.status(404).json({ message: "文章不存在" });
		}
		await post.update({
			isPublished: post.isPublished === true ? false : true,
		});
		return res.status(200).json({ message: "更新發布狀態成功" });
	} catch (err) {
		next(err);
	}
};

exports.softDeletePost = async (req, res, next) => {
	const schema = Joi.object({
		postId: Joi.number().integer().required().messages({
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
	const { postId } = value;
	try {
		const post = await Posts.findOne({ where: { id: postId } });
		if (!post) {
			return res.status(404).json({ message: "文章不存在" });
		}
		await post.destroy();
		return res.status(200).json({ message: "刪除文章成功", post });
	} catch (err) {
		next(err);
	}
};

exports.restorePost = async (req, res, next) => {
	const schema = Joi.object({
		postId: Joi.number().integer().required().messages({
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
	const { postId } = value;
	try {
		const post = await Posts.findOne({
			where: { id: postId },
			paranoid: false,
		});
		if (!post) {
			return res.status(404).json({ message: "文章不存在" });
		}
		await post.restore();
		return res.status(200).json({ message: "恢復文章成功" });
	} catch (err) {
		next(err);
	}
};

exports.forceDeletePost = async (req, res, next) => {
	const schema = Joi.object({
		postId: Joi.number().integer().required().messages({
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
	const { postId } = value;
	try {
		const post = await Posts.findOne({
			where: { id: postId },
			paranoid: false,
		});
		if (!post) {
			return res.status(404).json({ message: "文章不存在" });
		}
		await post.destroy({ force: true });
		return res.status(200).json({ message: "刪除文章成功" });
	} catch (err) {
		next(err);
	}
};

exports.createPostHashtags = async (req, res, next) => {
	const schema = Joi.object({
		postId: Joi.number().integer().required().messages({
			"number.base": "id必須是數字",
			"number.empty": "id不能為空",
			"any.required": "id是必填欄位",
		}),
		hashtagArray: Joi.array()
			.items(Joi.number().integer())
			.required()
			.messages({
				"array.base": "標籤陣列必須是陣列",
				"array.empty": "標籤陣列不能為空",
				"any.required": "標籤陣列是必填欄位",
			}),
	});
	const { error, value } = schema.validate(req.body);
	if (error) {
		return res
			.status(400)
			.json({ message: "資料格式錯誤", error: error.details[0].message });
	}
	const { postId, hashtagArray } = value;
	const transaction = await sequelize.transaction();
	try {
		const post = await Posts.findOne({
			where: { id: postId },
			transaction,
		});
		if (!post) {
			await transaction.rollback();
			return res.status(404).json({ message: "文章不存在" });
		}
		for (const hashtagId of hashtagArray) {
			const hashtag = await Hashtags.findOne({
				where: { id: hashtagId },
				transaction,
			});
			if (!hashtag) {
				await transaction.rollback();
				return res
					.status(404)
					.json({ message: `標籤${hashtagId}不存在` });
			}
		}

		const postHashtagBulk = hashtagArray.map((hashtagId) => ({
			postId,
			hashtagId,
		}));
		// console.log(postHashtagBulk);
		await PostHashtags.destroy({ where: { postId }, transaction }); // 先刪除原有的標籤
		await PostHashtags.bulkCreate(postHashtagBulk, { transaction });

		await transaction.commit();
		return res.status(200).json({ message: "success" });
	} catch (err) {
		console.log(err);
		await transaction.rollback();
		next(err);
	}
};

exports.getLocations = async (req, res, next) => {
	const schema = Joi.object({
		continent: Joi.string().optional().messages({
			"string.base": "國家/地區必須是字串",
			"string.empty": "國家/地區不能為空",
			"any.required": "國家/地區是必填欄位",
		}),
		id: Joi.number().integer().optional().messages({
			"number.base": "id必須是數字",
			"number.empty": "id不能為空",
			"any.required": "id是必填欄位",
		}),
	});
	const { error, value } = schema.validate(req.query);
	if (error) {
		return res
			.status(400)
			.json({ message: "資料格式錯誤", error: error.details[0].message });
	}
	const { continent, id } = value;

	try {
		const whereClause = {};
		if (continent) {
			whereClause.continent = continent;
		}
		if (id) {
			whereClause.id = id;
		}
		const locations = await Locations.findAll({
			attributes: [
				"id",
				"continent",
				"region",
				"country",
				"countryEn",
				"imageUrl",
			],
			where: whereClause,
		});
		return res
			.status(200)
			.json({ message: "取得國家/地區成功", locations });
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
		region: Joi.string().optional().allow("").messages({
			"string.base": "地區必須是字串",
		}),
		country: Joi.string().required().messages({
			"string.base": "國家必須是字串",
			"string.empty": "國家不能為空",
			"any.required": "國家是必填欄位",
		}),
		countryEn: Joi.string().required().messages({
			"string.base": "國家英文名稱必須是字串",
			"string.empty": "國家英文名稱不能為空",
			"any.required": "國家英文名稱是必填欄位",
		}),
	});
	const { error, value } = schema.validate(req.body);
	if (error) {
		return res
			.status(400)
			.json({ message: "資料格式錯誤", error: error.details[0].message });
	}
	const { continent, region, country, countryEn } = value;
	try {
		const location = await Locations.findOne({
			where: { country },
		});
		if (location) {
			return res.status(400).json({ message: "國家已存在" });
		}
		const newLocation = await Locations.create({
			continent,
			region,
			country,
			countryEn,
		});
		return res
			.status(200)
			.json({ message: "新增國家/地區成功", location: newLocation });
	} catch (err) {
		next(err);
	}
};

exports.updateLocationImg = async (req, res, next) => {
	const schema = Joi.object({
		locationId: Joi.number().integer().required().messages({
			"number.base": "id必須是數字",
			"number.empty": "id不能為空",
			"any.required": "id是必填欄位",
		}),
		imageUrl: Joi.string().required().messages({
			"string.base": "圖片URL必須是字串",
			"string.empty": "圖片URL不能為空",
			"any.required": "圖片URL是必填欄位",
		}),
	});
	const { error, value } = schema.validate(req.body);
	if (error) {
		return res
			.status(400)
			.json({ message: "資料格式錯誤", error: error.details[0].message });
	}
	const { locationId, imageUrl } = value;
	try {
		const location = await Locations.findOne({ where: { id: locationId } });
		if (!location) {
			return res.status(404).json({ message: "國家/地區不存在" });
		}
		await location.update({ imageUrl });
		return res
			.status(200)
			.json({ message: "更新國家/地區圖片成功", location });
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
		region: Joi.string().optional().allow("").messages({
			"string.base": "地區必須是字串",
		}),
		country: Joi.string().optional().messages({
			"string.base": "國家必須是字串",
			"string.empty": "國家不能為空",
			"any.required": "國家是必填欄位",
		}),
		countryEn: Joi.string().optional().messages({
			"string.base": "國家英文名稱必須是字串",
			"string.empty": "國家英文名稱不能為空",
			"any.required": "國家英文名稱是必填欄位",
		}),
		imageUrl: Joi.string().optional().messages({
			"string.base": "圖片URL必須是字串",
			"string.empty": "圖片URL不能為空",
			"any.required": "圖片URL是必填欄位",
		}),
	});
	const { error, value } = schema.validate(req.body);
	if (error) {
		return res
			.status(400)
			.json({ message: "資料格式錯誤", error: error.details[0].message });
	}
	const { locationId, continent, region, country, countryEn, imageUrl } =
		value;
	try {
		const location = await Locations.findOne({ where: { id: locationId } });
		if (!location) {
			return res.status(404).json({ message: "國家不存在" });
		}
		await location.update({
			continent,
			region,
			country,
			countryEn,
			imageUrl,
		});
		return res.status(200).json({ message: "更新國家/地區成功", location });
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
		const newHashtag = await Hashtags.create({ name });
		return res
			.status(200)
			.json({ message: "success", hashtag: newHashtag });
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
	const transaction = await sequelize.transaction();

	try {
		const hashtag = await Hashtags.findOne({
			where: { id: hashtagId },
			transaction,
		});
		if (!hashtag) {
			await transaction.rollback();
			return res.status(404).json({ message: "標籤不存在" });
		}
		await PostHashtags.destroy({ where: { hashtagId }, transaction });
		await Hashtags.destroy({ where: { id: hashtagId }, transaction });
		await transaction.commit();
		return res.status(200).json({ message: "已刪除標籤" });
	} catch (err) {
		await transaction.rollback();
		next(err);
	}
};
