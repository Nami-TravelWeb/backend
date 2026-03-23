"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
	class GalleryImages extends Model {
		/**
		 * Helper method for defining associations.
		 * This method is not a part of Sequelize lifecycle.
		 * The `models/index` file will call this method automatically.
		 */
		static associate(models) {
			// define association here
		}
	}
	GalleryImages.init(
		{
			id: {
				allowNull: false,
				autoIncrement: true,
				primaryKey: true,
				type: DataTypes.INTEGER,
			},
			url: {
				type: DataTypes.STRING,
				allowNull: false,
			},
			description: {
				type: DataTypes.STRING,
				allowNull: true,
			},
			travelDate: {
				type: DataTypes.DATE,
				allowNull: true,
			},
			location: {
				type: DataTypes.INTEGER,
				allowNull: false,
			},
			city: {
				type: DataTypes.STRING,
				allowNull: true,
			},
			deletedAt: {
				type: DataTypes.DATE,
				allowNull: true,
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
			modelName: "GalleryImages",
		},
	);
	return GalleryImages;
};
