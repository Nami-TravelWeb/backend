const { Locations, Posts } = require("../models");

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
