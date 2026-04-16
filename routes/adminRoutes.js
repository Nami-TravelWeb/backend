const express = require("express");
const router = express.Router();
const {
	adminLogin,
	getPosts,
	createPost,
	getHashTags,
	createHashTag,
	deleteHashTag,
	getLocations,
	createLocation,
	updateLocation,
	deleteLocation,
	createPostHashtags,
	getPostById,
	getPreSignedUrl,
	updateLocationImg,
	updatePost,
	updateIsPublishedStatus,
	softDeletePost,
	forceDeletePost,
} = require("../controller/adminController");
const { authenticate } = require("../middleware/authenticate");

router.post("/login", adminLogin);

router.use(authenticate);

router.post("/media/PreSignedUrl", getPreSignedUrl);

router.get("/post", getPosts);
router.get("/post/:postId", getPostById);
router.put("/post", updatePost);
router.post("/post", createPost);
router.post("/post/hashtag", createPostHashtags);
router.put("/post/isPublishedStatus", updateIsPublishedStatus);
router.delete("/post/soft", softDeletePost);
router.delete("/post/force", forceDeletePost);

router.get("/location", getLocations);
router.post("/location", createLocation);
router.put("/location", updateLocation);
router.delete("/location", deleteLocation);
router.put("/location/image", updateLocationImg);

router.get("/hashtag", getHashTags);
router.post("/hashtag", createHashTag);
router.delete("/hashtag", deleteHashTag);

module.exports = router;
