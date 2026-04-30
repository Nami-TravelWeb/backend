const express = require("express");
const router = express.Router();
const {
	getNavbarLocations,
	getPosts,
	getPostsById,
} = require("../controller/postController");

router.get("/locations/navbar", getNavbarLocations);

router.get("/", getPosts);
router.get("/:postId", getPostsById);

module.exports = router;
