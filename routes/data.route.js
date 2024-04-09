// 실험중

const express = require("express");
const DataController = require("../controllers/data.controller");
const { tryCatch } = require("../utils/try-catch.util");
const authMiddleware = require("../middlewares/auth.middleware");

const router = express.Router();

router
  .route("/update-tier-and-score")
  .post(authMiddleware, tryCatch(DataController.updateTierAndScore));
router
  .route("/send-question-to-frontend")
  .get(authMiddleware, tryCatch(DataController.sendQuestionToFrontend));

module.exports = router;
