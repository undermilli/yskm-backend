const express = require("express");
const UserController = require("../controllers/user.controller");
const { tryCatch } = require("../utils/try-catch.util");
const authMiddleware = require("../middlewares/auth.middleware");

const router = express.Router();

router
  .route("/")
  .get(authMiddleware, tryCatch(UserController.info))
  .put(authMiddleware, tryCatch(UserController.update));

router
  .route("/change-password")
  .put(authMiddleware, tryCatch(UserController.changePassword));

router
  .route("/update-score")
  .get(authMiddleware, tryCatch(UserController.updateScore));

module.exports = router;
