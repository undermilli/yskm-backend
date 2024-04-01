// 실험중

const express =  require("express");
const DataController = require("../controllers/data.controller");
const { tryCatch } = require("../utils/try-catch.util");
const authMiddleware = require("../middlewares/auth.middleware");

const router = express.Router();

router.route("/").get(authMiddleware, tryCatch(DataController.info));

// Currently can read database documents
router.route("/access-db").get(authMiddleware, tryCatch(DataController.accessDB));

// 실험중 ///
router.route("/set-tier").post(authMiddleware, tryCatch(DataController.setTier));
router.route("/get-questions").get(authMiddleware, tryCatch(DataController.getQuestions));
router.route("/update-tier-and-score").post(authMiddleware, tryCatch(DataController.updateTierAndScore));
router.route("/get-multiple-choice-answers").get(authMiddleware, tryCatch(DataController.getMultipleChoiceAnswers));
router.route("/update-questions-in-database").post(authMiddleware, tryCatch(DataController.updateQuestionsInDatabase));

router.route("/filter-questions-based-on-tiers").get(authMiddleware, tryCatch(DataController.filterQuestionsBasedOnTier));
router.route("/test-how-many-questions-are-there").get(authMiddleware, tryCatch(DataController.testHowManyDocs));

router.route("/send-question-to-frontend").get(authMiddleware, tryCatch(DataController.sendQuestionToFrontend));

module.exports = router;
