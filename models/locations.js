"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
	class Locations extends Model {
		/**
		 * Helper method for defining associations.
		 * This method is not a part of Sequelize lifecycle.
		 * The `models/index` file will call this method automatically.
		 */
		static associate(models) {
			// define association here
		}
	}
	Locations.init(
		{
			id: {
				allowNull: false,
				autoIncrement: true,
				primaryKey: true,
				type: DataTypes.INTEGER,
			},
			imageUrl: {
				type: DataTypes.STRING,
				allowNull: true,
			},
			continent: {
				type: DataTypes.STRING,
				allowNull: false,
			},
			region: {
				type: DataTypes.STRING,
				allowNull: false,
			},
			country: {
				type: DataTypes.STRING,
				allowNull: false,
			},
			countryEn: {
				type: DataTypes.STRING,
				allowNull: false,
			},
			createdAt: {
				allowNull: false,
				type: DataTypes.DATE,
			},
			updatedAt: {
				allowNull: false,
				type: DataTypes.DATE,
			},
		},
		{
			sequelize,
			modelName: "Locations",
		},
	);
	return Locations;
};
