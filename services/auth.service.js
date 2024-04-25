const bcrypt = require("bcryptjs");
const otpGenerator = require("otp-generator");
const httpStatus = require("http-status");
const jwt = require("jsonwebtoken");

const OTP = require("../models/otp.model");
const User = require("../models/user.model");
const AppError = require("../utils/app-error.util");
const { messages } = require("../constants/messages");
const { AuthValidator } = require("../validation/auth.validation");
const { getNanoId } = require("../utils/helpers");
const { ENV } = require("../configs/env.config");

/**
 * Pass email to validate and get it in return
 * @param {{email: string}} {email}
 * @returns {{email: string}} {email}
 * @throws {Joi.ValidationError}
 */
const getEmailAfterValidation = ({ email }) => {
  const { error, value } = AuthValidator.emailFormat.validate({ email });
  if (error) {
    throw error;
  }
  return value;
};

/**
 * Pass email and otp to validate and get it in return
 * @param {{email: string}} {email}
 * @param {{otp: number}} {otp}
 * @returns {{email: string, otp: number}} {email, otp}
 * @throws {Joi.ValidationError}
 */
const getEmailAndOTPAfterValidation = ({ email, otp }) => {
  const { error, value } = AuthValidator.checkOTPFormat.validate({
    email,
    otp,
  });
  if (error) {
    throw error;
  }
  return value;
};

/**
 * Pass forgotToken and password to validate and get it in return
 * @param {{forgotToken: string}} {forgotToken}
 * @param {{password: string}} {password}
 * @returns {{forgotToken: string, password: string}} {forgotPassword, password}
 * @throws {Joi.ValidationError}
 */
const getForgotTokenAndPasswordAfterValidation = ({
  forgotToken,
  password,
}) => {
  const { error, value } = AuthValidator.newPasswordFormat.validate({
    forgotToken,
    password,
  });
  if (error) {
    throw error;
  }
  return value;
};

/**
 * Pass email and password to validate and get it in return
 * @param {{email: string}} {email}
 * @param {{password: string}} {password}
 * @returns {{email: string, password: string}} {email, password}
 * @throws {Joi.ValidationError}
 */
const getEmailAndPasswordAfterValidation = ({ email, password }) => {
  const { error, value } = AuthValidator.emailAndPasswordFormat.validate({
    email,
    password,
  });
  if (error) {
    throw error;
  }
  return value;
};

/**
 * Check email exists in User collection
 * @param {string} email
 * @returns {boolean} false
 * @throws {httpStatus.CONFLICT} if already exists
 */
const checkUserEmailExists = async (email) => {
  const userExists = await User.findOne({ email });
  if (userExists) {
    throw new AppError(httpStatus.CONFLICT, messages.ALREADY_EXISTS);
  }
  return false;
};

/**
 * Check email exists in User collection
 * @param {string} email
 * @returns {boolean} true
 * @throws {httpStatus.UNAUTHORIZED} if not exists
 */
const isUserEmailExists = async (email) => {
  const userExists = await User.findOne({ email });
  if (!userExists) {
    throw new AppError(httpStatus.UNAUTHORIZED, messages.INVALID_EMAIL);
  }
  return true;
};

/**
 * Check email exists in OTP collection
 * @param {string} email
 * @returns {boolean} false
 * @throws {httpStatus.CONFLICT} if already exists
 */
const checkUserEmailExistsInOTP = async (email) => {
  const userExists = await OTP.findOne({ email });
  if (userExists) {
    throw new AppError(httpStatus.CONFLICT, messages.ALREADY_OTP_SENT);
  }
  return false;
};

/**
 * Get otp
 * @returns {number} otp
 */
const getNewOTP = async () => {
  let otp = otpGenerator.generate(6, {
    upperCaseAlphabets: false,
    lowerCaseAlphabets: false,
    specialChars: false,
  });
  let result = await OTP.findOne({ otp });
  while (result) {
    otp = otpGenerator.generate(6, {
      upperCaseAlphabets: false,
      lowerCaseAlphabets: false,
      specialChars: false,
    });
    // eslint-disable-next-line no-await-in-loop
    result = await OTP.findOne({ otp });
  }
  return Number(otp);
};

/**
 * Pass email and new generated otp to store in otp collection
 * @param {string} email
 * @param {number} otp
 */
const saveNewOTPwithEmail = async (email, otp) => {
  const otpPayload = { email, otp };
  await OTP.create(otpPayload);
};

/**
 * Pass signUpToken, nickname and password to validate through JOI
 * @param {{signUpToken: string, nickname: string, password: string}} {signUpToken, nickname, password}
 * @throws {Joi.ValidationError}
 */
const checkUserSignupInfo = ({ signUpToken, nickname, password }) => {
  const { error, value } = AuthValidator.signUpFormat.validate({
    signUpToken,
    nickname,
    password,
  });
  if (error) {
    throw error;
  }
  return value;
};

/**
 * Pass email and otp to find if exists in otp collection
 * @param {string} email
 * @param {number} otp
 * @throws {AppError} if not exists
 */
const checkOTPandEmailExists = async (email, otp) => {
  const response = await OTP.find({ email }).sort({ createdAt: -1 }).limit(1);
  if (response.length === 0) {
    throw new AppError(httpStatus.BAD_REQUEST, messages.OTP_EXPIRED);
  }
  if (otp !== response[0].otp) {
    throw new AppError(httpStatus.BAD_REQUEST, messages.OTP_INVALID);
  }
};

/**
 * Pass token and check if its invalid throw error
 * @param {string} token
 * @returns {{email: string, exp: number}} {email, exp} if valid
 * @throws {AppError} if token invalid
 */
const checkTokenExpired = (token) => {
  try {
    const decoded = jwt.verify(token, ENV.JWT_SECRET);
    if (decoded.exp < Date.now() / 1000) {
      throw new AppError(
        httpStatus.UNAUTHORIZED,
        httpStatus[httpStatus.UNAUTHORIZED],
      );
    } else {
      return decoded;
    }
  } catch (error) {
    throw new AppError(
      httpStatus.UNAUTHORIZED,
      httpStatus[httpStatus.UNAUTHORIZED],
    );
  }
};

/**
 * Pass user doc and password string to check its belong to user
 * @param {User} user
 * @param {string} password
 * @returns {boolean} true
 * @throws {AppError} UNAUTHORIZED
 */
const checkPasswordMatched = async (user, password) => {
  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw new AppError(httpStatus.UNAUTHORIZED, messages.INVALID_PASSWORD);
  }
  return true;
};

/**
 * Pass email and otp to find and delete from otp collection
 * @param {string} email
 * @param {number} otp
 */
const findEmailAndOTPtoDelete = async (email, otp) => {
  await OTP.findOneAndDelete({ email, otp });
};

/**
 * Bcrypt password by salt 10
 * @param {string} password
 * @returns {string} hashed password
 */
const getHashedPassword = async (password) => {
  const hashedPassword = await bcrypt.hash(password, 10);
  return hashedPassword;
};

/**
 * Pass email and get user document
 * @param {string} email
 * @returns {User} user document
 * @throws {AppError}
 */
const getUserByEmail = async (email) => {
  const user = await User.findOne({ email });
  if (!user) {
    throw new AppError(httpStatus.UNAUTHORIZED, messages.INVALID_EMAIL);
  }
  return user;
};

/**
 * Generate new user get by passing email, nickname and password
 * @param {string} email
 * @param {string} nickname
 * @param {string} password
 * @returns {User} Get user model new user instance
 */
const getCreateUser = (email, nickname, password) =>
  new User({
    email,
    nickname,
    password,
    hashtag: getNanoId(),
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

/**
 * Update password using email
 * @param {string} email
 * @param {string} password
 */
const updatePasswordByEmail = async (email, password) => {
  await User.findOneAndUpdate({ email }, { password });
};

const AuthService = {
  updatePasswordByEmail,
  isUserEmailExists,
  checkUserEmailExists,
  checkUserSignupInfo,
  checkOTPandEmailExists,
  checkUserEmailExistsInOTP,
  checkTokenExpired,
  checkPasswordMatched,
  findEmailAndOTPtoDelete,
  getUserByEmail,
  getEmailAfterValidation,
  getEmailAndOTPAfterValidation,
  getEmailAndPasswordAfterValidation,
  getForgotTokenAndPasswordAfterValidation,
  getHashedPassword,
  getNewOTP,
  getCreateUser,
  generateTokens,
  saveUser,
  saveNewOTPwithEmail,
};
module.exports = AuthService;
