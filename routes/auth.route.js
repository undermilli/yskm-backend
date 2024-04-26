const express = require("express");
const AuthController = require("../controllers/auth.controller");
const { tryCatch } = require("../utils/try-catch.util");

const router = express.Router();

router.post("/check-email", tryCatch(AuthController.checkEmail));
router.post("/send-otp", tryCatch(AuthController.sendOTP));
router.post("/check-otp", tryCatch(AuthController.checkOTP));
router.post("/signup", tryCatch(AuthController.signup));
router.post("/login", tryCatch(AuthController.login));
router.post("/refresh-token", tryCatch(AuthController.refreshToken));
router.post(
  "/check-forgot-email",
  tryCatch(AuthController.checkForgotEmailValid),
);
router.post("/send-otp-forgot", tryCatch(AuthController.sendOTPforForgot));
router.post("/check-otp-forgot", tryCatch(AuthController.checkForgotOTP));
router.put("/new-password", tryCatch(AuthController.newPassword));

module.exports = router;
