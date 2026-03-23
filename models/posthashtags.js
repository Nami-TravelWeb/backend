"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
	class PostHashtags extends Model {
		/**
		 * Helper method for defining associations.
		 * This method is not a part of Sequelize lifecycle.
		 * The `models/index` file will call this method automatically.
		 */
		static associate(models) {
			// define association here
		}
	}
	PostHashtags.init(
		{
			postId: {
				type: DataTypes.INTEGER,
				allowNull: false,
			},
			hashtagId: {
				type: DataTypes.INTEGER,
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
			modelName: "PostHashtags",
		},
	);
	return PostHashtags;
};
