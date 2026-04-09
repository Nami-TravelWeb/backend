"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
	class Posts extends Model {
		/**
		 * Helper method for defining associations.
		 * This method is not a part of Sequelize lifecycle.
		 * The `models/index` file will call this method automatically.
		 */
		static associate(models) {
			// define association here
			Posts.belongsTo(models.Locations, {
				foreignKey: "location",
				as: "locationInfo",
			});
			Posts.hasMany(models.PostHashtags, {
				foreignKey: "postId",
				as: "postHashtags",
			});
		}
	}
	Posts.init(
		{
			id: {
				allowNull: false,
				autoIncrement: true,
				primaryKey: true,
				type: DataTypes.INTEGER,
			},
			mainImageUrl: {
				type: DataTypes.STRING,
				allowNull: true,
			},
			title: {
				type: DataTypes.STRING,
				allowNull: false,
			},
			location: {
				type: DataTypes.INTEGER,
				allowNull: false,
			},
			city: {
				type: DataTypes.STRING,
				allowNull: true,
			},
			content: {
				type: DataTypes.TEXT,
				allowNull: false,
			},
			spots: {
				type: DataTypes.JSON,
				allowNull: true,
			},
			isPublished: {
				type: DataTypes.BOOLEAN,
				allowNull: false,
				defaultValue: false,
			},
			viewCount: {
				type: DataTypes.INTEGER,
				allowNull: false,
				defaultValue: 0,
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
			modelName: "Posts",
			paranoid: true,
			deletedAt: "deletedAt",
		},
	);
	return Posts;
};
