// 실험중

const express = require("express");
const DataController = require("../controllers/data.controller");
const { tryCatch } = require("../utils/try-catch.util");

const router = express.Router();

router
  .route("/update-tier-and-score")
  .post(tryCatch(DataController.updateTierAndScore));
router
  .route("/send-question-to-frontend")
  .get(tryCatch(DataController.sendQuestionToFrontend));
router
  .route("/get-user-ranking/:page")
  .get(tryCatch(DataController.getUserRanking));
module.exports = router;
