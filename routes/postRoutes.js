const express = require("express");
const router = express.Router();
const { getNavbarLocations } = require("../controller/postController");

router.get("/locations/navbar", getNavbarLocations);

module.exports = router;
