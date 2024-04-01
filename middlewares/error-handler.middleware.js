const { statusCodes } = require("../constants/codes");
const { messages } = require("../constants/messages");
const AppError = require("../utils/app-error.util");

// eslint-disable-next-line no-unused-vars
const errorHandler = (error, req, res, next) => {
  if (error.name === "ValidationError") {
    return res.status(statusCodes.VALIDATION).json({
      errorCode: statusCodes.VALIDATION,
      details: error.details,
    });
  }

  if (error instanceof AppError) {
    return res.status(error.statusCode).json({
      errorCode: error.errorCode,
      message: error.message,
    });
  }
  return res.status(statusCodes.SERVER_ERROR).send(messages.SERVER_ERROR);
};

module.exports = errorHandler;
