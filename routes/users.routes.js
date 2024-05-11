const express = require("express");
const {
  getUser,
  updateUser,
  getUserProfile,
  getAllUsers,
  deleteUser,
} = require("../controller/users.controller");
const router = express.Router();

router.get("/get-user", getUser);
router.put("/update-user", updateUser);
router.put("/update-user-profile", updateUser);
router.get("/show-user-profile", getUserProfile);
router.get("/get-user-profile", getAllUsers);
router.delete("/delete-user", deleteUser);

module.exports = router;
