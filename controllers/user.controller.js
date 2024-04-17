const { statusCodes } = require("../constants/codes");
const { messages } = require("../constants/messages");
const AuthService = require("../services/auth.service");
const UserService = require("../services/user.service");
const AppError = require("../utils/app-error.util");
const {
  isTwentyFourHrsPassed,
  getCurrentKST,
  getStartDayOfKST,
} = require("../utils/helpers");

exports.info = async (req, res) => {
  res.status(statusCodes.SUCCESS).json({
    code: statusCodes.SUCCESS,
    message: messages.USER_INFO,
    user: {
      // eslint-disable-next-line no-underscore-dangle
      id: req.user._id,
      username: req.user.username,
      score: req.user.score,
      scoreLastUpdate: req.user.scoreLastUpdate,
      email: req.user.email,
      description: req.user.description,
      createdAt: req.user.createdAt,
      lastVisited: req.user.lastVisited,
      tier: req.user.tier,
      questionsAnsweredNb: req.user.questionsAnsweredNb,
    },
  });
};

exports.update = async (req, res) => {
  const { email, description } = UserService.checkEmailAndDescription(req.body);

  req.user.email = email;
  req.user.description = description;

  const updatedUser = await AuthService.saveUser(req.user);

  res.status(statusCodes.SUCCESS).json({
    code: statusCodes.SUCCESS,
    message: messages.USER_UPDATED,
    user: {
      // eslint-disable-next-line no-underscore-dangle
      id: updatedUser._id,
      username: updatedUser.username,
      score: updatedUser.score,
      scoreLastUpdate: updatedUser.scoreLastUpdate,
      email: updatedUser.email,
      description: updatedUser.description,
      createdAt: updatedUser.createdAt,
      lastVisited: updatedUser.lastVisited,
      tier: updatedUser.tier,
      questionsAnsweredNb: updatedUser.questionsAnsweredNb,
    },
  });
};

exports.changePassword = async (req, res) => {
  const { oldPassword, newPassword } = UserService.checkOldAndNewPassword(
    req.body,
  );

  await UserService.isOldPasswordMatched(req.user, oldPassword);
  const hashedPassword = await AuthService.getHashedPassword(newPassword);

  req.user.password = hashedPassword;

  AuthService.saveUser(req.user);

  res.status(statusCodes.SUCCESS).json({
    code: statusCodes.SUCCESS,
    message: messages.PASSWORD_UPDATED,
  });
};

exports.updateScore = async (req, res) => {
  const { score } = req.user;

  if (score === 0) {
    req.user.score = score + 1;
    req.user.scoreLastUpdate = Date.now();
  } else {
    const isPassed = isTwentyFourHrsPassed(
      getCurrentKST(),
      getStartDayOfKST(req.user.scoreLastUpdate),
    );
    if (isPassed) {
      req.user.score = score + 1;
      req.user.scoreLastUpdate = Date.now();
    } else {
      throw new AppError(
        statusCodes.ERROR,
        messages.ALREADY_GOT_TODAY_SCORE,
        statusCodes.ERROR,
      );
    }
  }

  const updatedUser = await AuthService.saveUser(req.user);

  res.status(statusCodes.SUCCESS).json({
    code: statusCodes.SUCCESS,
    user: {
      // eslint-disable-next-line no-underscore-dangle
      id: updatedUser._id,
      username: updatedUser.username,
      score: updatedUser.score,
      scoreLastUpdate: updatedUser.scoreLastUpdate,
      email: updatedUser.email,
      description: updatedUser.description,
      createdAt: updatedUser.createdAt,
      lastVisited: updatedUser.lastVisited,
      tier: updatedUser.tier,
      questionsAnsweredNb: updatedUser.questionsAnsweredNb,
    },
  });
};
