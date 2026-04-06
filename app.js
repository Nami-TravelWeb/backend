const cors = require("cors");
const Sequelize = require("sequelize");
const config = require("./config/config.json")[process.env.NODE_ENV];
const serverless = require("serverless-http");
const moment = require("moment-timezone");
const routers = require("./routes");
const express = require("express");
const app = express();
moment.tz.setDefault("Asia/Taipei");
// const admin = require("firebase-admin");

// const serviceAccount = require("./config/sugarbee-" +
// 	process.env.FIREBASE_ENV +
// 	"-firebase-admin.json");

// admin.initializeApp({
// 	credential: admin.credential.cert(serviceAccount),
// 	databaseURL: process.env.FIREBASE_REALTIME_DB_URL,
// });
// databaseURL: process.env.FIREBASE_REALTIME_DB_URL 也可以放入json檔案

let sequelize;

// 初始化資料庫連線
const initializeDatabase = async () => {
	if (!sequelize) {
		console.log("Initializing new database connection...");
		sequelize = new Sequelize(config);
		try {
			await sequelize.authenticate();
			console.log("Database connection established successfully.");
		} catch (error) {
			console.error("Unable to connect to the database:", error);
			throw error;
		}
	}
	return sequelize;
};

// 設置應用信任代理，讓 req.ip 能正確獲取用戶 IP 地址
// 當應用運行在代理伺服器（如 Nginx、AWS ELB）後面時，這個設置很重要
app.set("trust proxy", true);

app.use(express.json({ limit: "50mb", extended: true }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

app.use(
	cors({
		origin:
			process.env.NODE_ENV === "production"
				? [
						"https://sugarbee.vip",
						"https://www.sugarbee.vip",
						"https://www.sugarbee.life",
						"https://sugarbee.life",
					] // 生產環境只允許特定網域
				: "*", // 開發環境允許本地端
		methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"], // 明確指定允許的 HTTP 方法
		allowedHeaders: ["Content-Type", "Authorization"], // 允許的 request headers
		exposedHeaders: ["Content-Range", "X-Content-Range"], // 允許瀏覽器存取的 response headers
	}),
);

app.use(routers);

app.use(async (req, res, next) => {
	try {
		await initializeDatabase(); // 確保連線初始化
		next();
	} catch (error) {
		console.error("Database connection failed:", error);
		res.status(500).json({ message: "Internal Server Error" });
	}
});

module.exports = app;
