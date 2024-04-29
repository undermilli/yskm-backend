const httpStatus = require("http-status");

const User = require("../models/user.model");
const AppError = require("../utils/app-error.util");
const { messages } = require("../constants/messages");
const AuthService = require("../services/auth.service");
const { ENV } = require("../configs/env.config");
const { generateTokenByEmail } = require("../utils/helpers");

exports.checkEmail = async (req, res) => {
  const { email } = AuthService.getEmailAfterValidation(req.body);
  await AuthService.checkUserEmailExists(email);

  res.status(httpStatus.OK).json({
    message: httpStatus[httpStatus.OK],
  });
};

exports.sendOTP = async (req, res) => {
  const { email } = AuthService.getEmailAfterValidation(req.body);
  await AuthService.checkUserEmailExists(email); // email already checked in checkEmail
  await AuthService.checkUserEmailExistsInOTP(email);
  const otp = await AuthService.getNewOTP();
  await AuthService.saveNewOTPwithEmail(email, otp);
  res.status(httpStatus.OK).json({
    message: messages.OTP_SENT,
    data: {
      expireInMins: Number(ENV.OTP_EXPIRE_IN_MINS),
    },
  });
};

exports.checkOTP = async (req, res) => {
  const { email, otp } = AuthService.getEmailAndOTPAfterValidation(req.body);
  await AuthService.checkOTPandEmailExists(email, otp);
  await AuthService.findEmailAndOTPtoDelete(email, otp);
  res.status(httpStatus.OK).json({
    message: httpStatus[httpStatus.OK],
    data: {
      signUpToken: generateTokenByEmail(email),
    },
  });
};

exports.signup = async (req, res) => {
  const data = req.body;
  const token = data.signUpToken;
  const name = data.nickname;
  const pswd = data.password;
  const { signUpToken, nickname, password } = AuthService.checkUserSignupInfo({
    signUpToken: token,
    nickname: name,
    password: pswd,
  });
  const { email } = AuthService.checkTokenExpired(signUpToken);
  await AuthService.checkUserEmailExists(email);
  const hashedPassword = await AuthService.getHashedPassword(password);
  const newUser = AuthService.getCreateUser(
    email,
    nickname,
    hashedPassword,
    data.score,
    data.tier,
    data.questionAnsweredNB,
  );
  const { accessToken, refreshToken } = AuthService.generateTokens(newUser);
  AuthService.saveUser(newUser);

  return res.status(httpStatus.CREATED).json({
    message: httpStatus[httpStatus.CREATED],
    data: { accessToken, refreshToken },
  });
};

exports.login = async (req, res) => {
  const { email, password } = AuthService.getEmailAndPasswordAfterValidation(
    req.body,
  );
  const user = await AuthService.getUserByEmail(email);

  await AuthService.checkPasswordMatched(user, password);

  const accessToken = user.generateAccessToken();
  const refreshToken = user.generateRefreshToken();

  user.lastVisited = Date.now();
  AuthService.saveUser(user);
  return res.status(httpStatus.OK).json({
    message: messages.LOGIN,
    data: { accessToken, refreshToken },
  });
};

exports.checkForgotEmailValid = async (req, res) => {
  const { email } = AuthService.getEmailAfterValidation(req.body);
  await AuthService.isUserEmailExists(email);

  res.status(httpStatus.OK).json({
    message: httpStatus[httpStatus.OK],
  });
};

exports.sendOTPforForgot = async (req, res) => {
  const { email } = AuthService.getEmailAfterValidation(req.body);
  await AuthService.isUserEmailExists(email);
  await AuthService.checkUserEmailExistsInOTP(email);
  const otp = await AuthService.getNewOTP();
  await AuthService.saveNewOTPwithEmail(email, otp);

  res.status(httpStatus.OK).json({
    message: messages.OTP_SENT,
    data: {
      expireInMins: Number(ENV.OTP_EXPIRE_IN_MINS),
    },
  });
};

exports.checkForgotOTP = async (req, res) => {
  const { email, otp } = AuthService.getEmailAndOTPAfterValidation(req.body);
  await AuthService.checkOTPandEmailExists(email, otp);
  await AuthService.findEmailAndOTPtoDelete(email, otp);

  res.status(httpStatus.OK).json({
    message: httpStatus[httpStatus.OK],
    data: {
      forgotToken: generateTokenByEmail(email),
    },
  });
};

exports.newPassword = async (req, res) => {
  const { forgotToken, password } =
    AuthService.getForgotTokenAndPasswordAfterValidation(req.body);
  const { email } = AuthService.checkTokenExpired(forgotToken);
  await AuthService.isUserEmailExists(email);
  const hashedPassword = await AuthService.getHashedPassword(password);
  await AuthService.updatePasswordByEmail(email, hashedPassword);

  res.status(httpStatus.OK).json({
    message: messages.PASSWORD_UPDATED,
  });
};

exports.refreshToken = async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken || typeof refreshToken !== "string") {
    throw new AppError(httpStatus.UNAUTHORIZED, messages.INVALID_TOKEN);
  }

  const user = await User.findOne({ "refreshTokens.token": refreshToken });

  if (!user) {
    throw new AppError(httpStatus.UNAUTHORIZED, messages.INVALID_REFRESH_TOKEN);
  }

  const validToken = user.refreshTokens.find(
    (token) => token.token === refreshToken && token.expiresIn > new Date(),
  );

  if (!validToken) {
    throw new AppError(httpStatus.UNAUTHORIZED, messages.EXPIRE_REFRESH_TOKEN);
  }

  const newAccessToken = user.generateAccessToken();

  return res.status(httpStatus.OK).json({
    message: messages.NEW_ACCESS_TOKEN,
    data: { newAccessToken },
  });
};
