"use strict";
/** @type {import('sequelize-cli').Migration} */
module.exports = {
	async up(queryInterface, Sequelize) {
		await queryInterface.createTable(
			"Posts",
			{
				id: {
					allowNull: false,
					autoIncrement: true,
					primaryKey: true,
					type: Sequelize.INTEGER,
				},
				mainImageUrl: {
					type: Sequelize.STRING,
					allowNull: true,
				},
				title: {
					type: Sequelize.STRING,
					allowNull: false,
				},
				location: {
					type: Sequelize.INTEGER,
					allowNull: false,
				},
				city: {
					type: Sequelize.STRING,
					allowNull: true,
				},
				content: {
					type: Sequelize.TEXT,
					allowNull: false,
				},
				spots: {
					type: Sequelize.JSON,
					allowNull: true,
				},
				isPublished: {
					type: Sequelize.BOOLEAN,
					allowNull: false,
					defaultValue: false,
				},
				deletedAt: {
					type: Sequelize.DATE,
					allowNull: true,
				},
				createdAt: {
					allowNull: false,
					type: Sequelize.DATE,
				},
				updatedAt: {
					allowNull: false,
					type: Sequelize.DATE,
				},
			},
			{
				paranoid: true,
				deletedAt: "deletedAt",
			},
		);
	},
	async down(queryInterface, Sequelize) {
		await queryInterface.dropTable("Posts");
	},
};
