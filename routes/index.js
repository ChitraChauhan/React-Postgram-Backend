const express = require("express");
const usersRoutes = require("./users.routes");
const authRoutes = require("./auth.routes");
const postRoutes = require("./posts.routes");
const conversationRoute = require("./conversation.routes");
const messagesRoute = require("./messages.routes");
const authorizeUser = require("../middleware/auth");
const router = express.Router();

router.get("/", (req, res) => {
  res.status(200).json({ status: "success", message: "Social media root." });
});

router.use("/auth", authRoutes);
router.use("/users", authorizeUser, usersRoutes);
router.use("/posts", authorizeUser, postRoutes);
router.use("/conversations", authorizeUser, conversationRoute);
router.use("/messages", authorizeUser,messagesRoute);

module.exports = router;
