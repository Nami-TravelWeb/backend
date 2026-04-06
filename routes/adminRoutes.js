const express = require("express");
const router = express.Router();
const { adminLogin, getPosts } = require("../controller/adminController");
const { authenticate } = require("../middleware/authenticate");

router.post("/login", adminLogin);

router.use(authenticate);
router.get("/posts", getPosts);

module.exports = router;
