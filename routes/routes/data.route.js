// 실험중

const express =  require("express");
const DataController = require("../controllers/data.controller");
const { tryCatch } = require("../utils/try-catch.util");
const authMiddleware = require("../middlewares/auth.middleware");

const router = express.Router();

router.route("/").get(authMiddleware, tryCatch(DataController.info));


