const express = require("express");
const upload = require("../middleware/multer");
const {
  createPost,
  getFeedPost,
  getUsersPosts,
  getImage,
  deletePost,
  updatePost
} = require("../controller/posts.controller");
const router = express.Router();

router.post("/create-post", upload.single("filePath"), createPost);
router.get("/get-feed-post", getFeedPost);
router.get("/get-user-posts", getUsersPosts);
router.get("/get-feed-image", getImage);
router.delete("/delete-post/:id", deletePost);
router.put("/update-post", updatePost);

module.exports = router;
