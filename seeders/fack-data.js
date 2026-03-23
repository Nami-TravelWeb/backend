"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
	async up(queryInterface, Sequelize) {
		await queryInterface.bulkInsert("Admins", [
			{
				account: "GJNami",
				password: "g0323",
				createdAt: new Date(),
				updatedAt: new Date(),
			},
		]);
	},
	async down(queryInterface, Sequelize) {},
};
