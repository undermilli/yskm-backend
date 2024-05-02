const jwt = require("jsonwebtoken");
const User = require("../models/user.model");
const AppError = require("../utils/app-error.util");
const { statusCodes } = require("../constants/codes");
const { messages } = require("../constants/messages");
const { ENV } = require("../configs/env.config");

const {
  updateUserValidator,
  updatePasswordValidator,
} = require("../validation/user.validation");

/**
 * Extract userId from token
 * @param {string} authKey
 * @returns {string} userId
 */
const getUserIdFromToken = (authKey = "") => {
  const decoded = jwt.verify(authKey, ENV.JWT_SECRET);
  return decoded.userId;
};

/**
 * Get user data
 * @param {string} userId
 * @returns {User} user data
 */
const getUser = async (userId = "") => {
  const user = await User.findById(userId);
  if (!user) {
    throw new AppError(
      statusCodes.NOT_FOUND,
      messages.NOT_FOUND,
      statusCodes.NOT_FOUND,
    );
  }
  return user;
};

/**
 * Pass email and description to validate through JOI
 * @param {string} email
 * @param {string} description
 * @throws {Joi.ValidationError}
 */
const checkEmailAndDescription = ({ email = "", description = "" }) => {
  const { error, value } = updateUserValidator.validate({ email, description });
  if (error) {
    throw error;
  }
  return value;
};

/**
 * Pass old and new password to validate through JOI
 * @param {string} oldPassword
 * @param {string} newPassword
 * @throws {Joi.ValidationError}
 */
const checkOldAndNewPassword = ({ oldPassword = "", newPassword = "" }) => {
  const { error, value } = updatePasswordValidator.validate({
    oldPassword,
    newPassword,
  });
  if (error) {
    throw error;
  }
  return value;
};

/**
 * Pass old and validate in db
 * @param {string} oldPassword
 * @param {string} newPassword
 * @throws {AppError}
 */
const isOldPasswordMatched = async (user, oldPassword = "") => {
  const isMatch = await user.comparePassword(oldPassword);
  if (!isMatch) {
    throw new AppError(
      statusCodes.NOT_FOUND,
      messages.INVALID_OLD_PASSWORD,
      statusCodes.NOT_FOUND,
    );
  }
};

const UserService = {
  getUserIdFromToken,
  getUser,
  checkEmailAndDescription,
  checkOldAndNewPassword,
  isOldPasswordMatched,
};

module.exports = UserService;
