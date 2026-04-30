const express = require("express");
const router = express.Router();
const postRoutes = require("./postRoutes");
const adminRoutes = require("./adminRoutes");

router.use("/post", postRoutes);
router.use("/admin", adminRoutes);
module.exports = router;
