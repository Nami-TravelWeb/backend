const express = require("express");
const router = express.Router();
const {
	getNavbarLocations,
	getPosts,
} = require("../controller/postController");

router.get("/locations/navbar", getNavbarLocations);
router.get("/", getPosts);

module.exports = router;
