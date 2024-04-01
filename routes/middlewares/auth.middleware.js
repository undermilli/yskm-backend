const jwt = require("jsonwebtoken");
const { statusCodes } = require("../constants/codes");
const { messages } = require("../constants/messages");
const UserService = require("../services/user.service");
const AuthService = require("../services/auth.service");

// eslint-disable-next-line consistent-return
const authMiddleware = async (req, res, next) => {
  const token = req.header("Authorization");

  if (!token || typeof token !== "string") {
    return res.status(statusCodes.UNAUTHORIZED).json({
      errorCode: statusCodes.UNAUTHORIZED,
      message: messages.INVALID_TOKEN,
    });
  }

  try {
    const decoded = jwt.verify(token.split(" ")[1], process.env.JWT_SECRET);

    const currentTimestamp = Math.floor(Date.now() / 1000);
    const expirationTime = decoded.exp;

    if (currentTimestamp > expirationTime) {
      return res.status(statusCodes.UNAUTHORIZED).json({
        message: messages.EXPIRE_TOKEN,
        errorCode: statusCodes.UNAUTHORIZED,
      });
    }

    const user = await UserService.getUser(decoded.userId);

    user.lastVisited = Date.now();
    await AuthService.saveUser(user);

    req.user = user;
    next();
  } catch (error) {
    return res.status(statusCodes.UNAUTHORIZED).json({
      errorCode: statusCodes.UNAUTHORIZED,
      message: messages.INVALID_TOKEN,
    });
  }
};

module.exports = authMiddleware;
