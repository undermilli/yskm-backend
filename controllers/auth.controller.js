const User = require("../models/user.model");
const AppError = require("../utils/app-error.util");
const { statusCodes } = require("../constants/codes");
const { messages } = require("../constants/messages");
const AuthService = require("../services/auth.service");
const { authValidator } = require("../validation/auth.validation");

exports.signup = async (req, res) => {
  const usernameToCheck = req.body.username;
  const passwordToCheck = req.body.password;
  const { username, password } = AuthService.checkUsernameAndPassword({
    username: usernameToCheck,
    password: passwordToCheck,
  });
  await AuthService.checkUserExists(username);

  const hashedPassword = await AuthService.getHashedPassword(password);

  const newUser = AuthService.getCreateUser(
    username,
    hashedPassword,
    req.body.score,
    req.body.tier,
    req.body.questionsAnsweredNb,
  );
  const { accessToken, refreshToken } = AuthService.generateTokens(newUser);
  await AuthService.saveUser(newUser);
  return res.status(statusCodes.CREATED).json({
    code: statusCodes.CREATED,
    message: messages.CREATED,
    accessToken,
    refreshToken,
  });
};

exports.login = async (req, res) => {
  const username = req.body.username;
  const password = req.body.password;
  const { error } = authValidator.validate({ username, password });
  if (error) {
    throw error;
  }
  const user = await User.findOne({ username });
  if (!user) {
    throw new AppError(
      statusCodes.UNAUTHORIZED,
      messages.INVALID_USERNAME,
      statusCodes.UNAUTHORIZED,
    );
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw new AppError(
      statusCodes.UNAUTHORIZED,
      messages.INVALID_PASSWORD,
      statusCodes.UNAUTHORIZED,
    );
  }

  const accessToken = user.generateAccessToken();
  const refreshToken = user.generateRefreshToken();

  user.lastVisited = Date.now();
  await user.save();

  return res.status(statusCodes.SUCCESS).json({
    code: statusCodes.SUCCESS,
    message: messages.LOGIN,
    accessToken,
    refreshToken,
  });
};

exports.refreshToken = async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken || typeof refreshToken !== "string") {
    throw new AppError(
      statusCodes.UNAUTHORIZED,
      messages.INVALID_TOKEN,
      statusCodes.UNAUTHORIZED,
    );
  }

  const user = await User.findOne({ "refreshTokens.token": refreshToken });

  if (!user) {
    throw new AppError(
      statusCodes.UNAUTHORIZED,
      messages.INVALID_REFRESH_TOKEN,
      statusCodes.UNAUTHORIZED,
    );
  }

  const validToken = user.refreshTokens.find(
    (token) => token.token === refreshToken && token.expiresIn > new Date(),
  );

  if (!validToken) {
    throw new AppError(
      statusCodes.UNAUTHORIZED,
      messages.EXPIRE_REFRESH_TOKEN,
      statusCodes.UNAUTHORIZED,
    );
  }

  const newAccessToken = user.generateAccessToken();

  return res.status(statusCodes.SUCCESS).json({
    code: statusCodes.SUCCESS,
    message: messages.NEW_ACCESS_TOKEN,
    newAccessToken,
  });
};
