// models/otpModel.js
const mongoose = require("mongoose");
const { mailSender } = require("../utils/mail-sender.util.js");
const { ENV } = require("../configs/env.config");

const otpSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    minlength: 5,
    maxlength: 320,
    match: /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/,
  },
  otp: {
    type: Number,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 60 * ENV.OTP_EXPIRE_IN_MINS, // The document will be automatically deleted certain minutes of its creation time
  },
});

async function sendVerificationEmail(email, otp) {
  await mailSender(
    email,
    "YSKM 인증번호 메일입니다",
    `<h1>인증번호를 확인하고 입력해 주세요</h1><br>
    <p>인증번호: ${otp}</p>`,
  );
}
// eslint-disable-next-line func-names
otpSchema.pre("save", async function (next) {
  if (this.isNew) await sendVerificationEmail(this.email, this.otp);
  next();
});

const OTP = mongoose.model("OTP", otpSchema);
module.exports = OTP;
