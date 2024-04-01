const express = require("express");
const AuthController = require("../controllers/auth.controller");
const { tryCatch } = require("../utils/try-catch.util");

const router = express.Router();

router.post("/signup", tryCatch(AuthController.signup));
router.post("/login", tryCatch(AuthController.login));
router.post("/refresh-token", tryCatch(AuthController.refreshToken));

module.exports = router;
