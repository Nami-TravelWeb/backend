const {
	Locations,
	Posts,
	PostHashtags,
	Hashtags,
	sequelize,
} = require("../models");
const { Op } = require("sequelize");
const Joi = require("joi");

exports.getNavbarLocations = async (req, res, next) => {
	try {
		const rows = await Locations.findAll({
			attributes: ["continent", "region", "country", "countryEn"],
			raw: true,
		});

		/** continent -> region -> { country, countryEn }[] */
		const byContinent = new Map();
		for (const { continent, region, country, countryEn } of rows) {
			if (!byContinent.has(continent)) {
				byContinent.set(continent, new Map());
			}
			const byRegion = byContinent.get(continent);
			if (!byRegion.has(region)) {
				byRegion.set(region, []);
			}
			byRegion.get(region).push({ country, countryEn });
		}

		const locations = [...byContinent.entries()].map(
			([continent, regionMap]) => ({
				continent,
				regions: [...regionMap.entries()].map(
					([region, countryArr]) => ({
						region,
						countries: countryArr,
						// countries: countryArr.filter(
						// 	(c) => c.country !== "臺灣",
						// ),
					}),
				),
			}),
		);

		return res
			.status(200)
			.json({ message: "取得國家/地區成功", locations });
	} catch (err) {
		next(err);
	}
};

exports.getPosts = async (req, res, next) => {
	const schema = Joi.object({
		page: Joi.number().integer().default(1).messages({
			"number.base": "頁碼必須是數字",
			"number.empty": "頁碼不能為空",
		}),
		limit: Joi.number().integer().default(50).messages({
			"number.base": "每頁筆數必須是數字",
			"number.empty": "每頁筆數不能為空",
		}),
		order: Joi.number().integer().default(1).messages({
			"number.base": "排序必須是數字",
			"number.empty": "排序不能為空",
		}),
		countryEn: Joi.string().optional().messages({
			"string.base": "國家必須是字串",
			"string.empty": "國家不能為空",
		}),
		city: Joi.string().optional().messages({
			"string.base": "城市必須是字串",
			"string.empty": "城市不能為空",
		}),
		search: Joi.string().optional().messages({
			"string.base": "搜尋必須是字串",
			"string.empty": "搜尋不能為空",
		}),
	});
	const { error, value } = schema.validate(req.query);
	if (error) {
		return res
			.status(400)
			.json({ message: "資料格式錯誤", error: error.details[0].message });
	}
	const { countryEn, order, city, search, page, limit } = value;
	const offset = (page - 1) * limit;
	try {
		const whereClause = {
			isPublished: true,
			deletedAt: null,
		};
		if (countryEn) {
			whereClause.id = {
				[Op.in]: sequelize.literal(`(
					SELECT p.id FROM Posts AS p
					INNER JOIN Locations AS l ON p.location = l.id
					WHERE l.countryEn = '${countryEn}'
				)`),
			};
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
		} else {
			orderArray.push(["createdAt", "DESC"]);
		}

		const { count, rows: posts } = await Posts.findAndCountAll({
			attributes: [
				"id",
				"title",
				"mainImageUrl",
				"location",
				"city",
				"isPublished",
				"viewCount",
				"deletedAt",
				"createdAt",
				"updatedAt",
			],
			include: [
				{
					model: Locations,
					as: "locationInfo",
					attributes: [
						"id",
						"imageUrl",
						"continent",
						"region",
						"country",
						"countryEn",
					],
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
			where: whereClause,
			offset,
			limit,
			order: orderArray,
			distinct: true,
		});

		return res.status(200).json({
			message: "取得文章成功",
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

exports.getPostsById = async (req, res, next) => {
	const schema = Joi.object({
		postId: Joi.number().integer().required().messages({
			"number.base": "文章id必須是數字",
			"number.empty": "文章id不能為空",
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
			where: { id: postId, isPublished: true },
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
			attributes: [
				"id",
				"title",
				"location",
				"city",
				"content",
				"spots",
				"viewCount",
				"createdAt",
			],
		});
		if (!post) {
			return res.status(404).json({ message: "文章不存在" });
		}
		return res.status(200).json({ message: "success", post });
	} catch (err) {
		next(err);
	}
};
