const bcrypt = require("bcryptjs");

const User = require("../models/user.model");
const AppError = require("../utils/app-error.util");
const { messages } = require("../constants/messages");
const { statusCodes } = require("../constants/codes");
const { authValidator } = require("../validation/auth.validation");

/**
 * Pass username and password to validate through JOI
 * @param {string} username
 * @param {string} password
 * @throws {Joi.ValidationError}
 */
const checkUsernameAndPassword = ({ username = "", password = "" }) => {
  const { error, value } = authValidator.validate({ username, password });
  if (error) {
    throw error;
  }
  return value;
};

/**
 * Check username exists in db
 * @param {string} username
 * @throws {statusCodes.ALREADY_EXISTS}
 */
const checkUserExists = async (username = "") => {
  const existingUser = await User.findOne({ username });

  if (existingUser) {
    throw new AppError(
      statusCodes.ALREADY_EXISTS,
      messages.ALREADY_EXISTS,
      statusCodes.ALREADY_EXISTS,
    );
  }
};

/**
 * Bcrypt password by salt 10
 * @param {string} password
 * @returns {string} hashed password
 */
const getHashedPassword = async (password = "") => {
  const hashedPassword = await bcrypt.hash(password, 10);
  return hashedPassword;
};

/**
 * Generate new user get by passing username and password
 * @param {string} username
 * @param {string} hashedPassword
 * @returns {User} Get user model new user instance
 */
const getCreateUser = (username = "", hashedPassword = "") =>
  new User({
    username,
    password: hashedPassword,
  });

/**
 * Generate refresh and access Token using user model instance
 * @param {User} user
 * @returns {{string, string}} {accessToken, refreshToken} Object
 */
const generateTokens = (user) => {
  const accessToken = user.generateAccessToken();
  const refreshToken = user.generateRefreshToken();
  return { accessToken, refreshToken };
};

/**
 * Save user to db
 * @param {User} user
 * @returns {User} user
 */
const saveUser = async (user) => {
  const userSave = await user.save();
  return userSave;
};

const AuthService = {
  checkUsernameAndPassword,
  checkUserExists,
  getHashedPassword,
  getCreateUser,
  generateTokens,
  saveUser,
};
module.exports = AuthService;
