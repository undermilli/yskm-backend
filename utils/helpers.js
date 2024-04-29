const moment = require("moment-timezone");
const { customAlphabet } = require("nanoid");
const jwt = require("jsonwebtoken");
const { ENV } = require("../configs/env.config");

exports.getStartDayOfKST = (utcDate) =>
  moment(utcDate).tz("Asia/Seoul").startOf("day").format();

exports.getCurrentKST = () => moment(Date.now()).tz("Asia/Seoul").format();

exports.isTwentyFourHrsPassed = (currentKST, lastUpdateKST) => {
  const hoursPassed = moment(currentKST).diff(lastUpdateKST, "hours");
  return hoursPassed >= 24;
};

exports.getNanoId = () => customAlphabet("0A1B2C3D4E5F6G7H8I9J", 10)(4);

exports.getNanoIdOfSix = () => customAlphabet("0a1b2c3d4e5f6g7h8i9j", 10)(6);

exports.generateTokenByEmail = (email) => {
  const expirationTime = Math.floor(Date.now() / 1000) + 60 * 60; // for 1hr
  return jwt.sign({ email, exp: expirationTime }, ENV.JWT_SECRET);
};
