const express = require("express");
const router = express.Router();
const {
	adminLogin,
	getPosts,
	createPost,
} = require("../controller/adminController");
const { authenticate } = require("../middleware/authenticate");

router.post("/login", adminLogin);

router.use(authenticate);
router.get("/posts", getPosts);
router.post("/posts", createPost);

module.exports = router;
