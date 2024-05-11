const express = require("express");
const usersRoutes = require("./users.routes");
const authRoutes = require("./auth.routes");
const postRoutes = require("./posts.routes");
const authorizeUser = require("../middleware/auth");
const router = express.Router();

router.get("/", (req, res) => {
  res.status(200).json({ status: "success", message: "Social media root." });
});

router.use("/auth", authRoutes);
router.use("/users", authorizeUser, usersRoutes);
router.use("/posts", authorizeUser, postRoutes);

module.exports = router;
