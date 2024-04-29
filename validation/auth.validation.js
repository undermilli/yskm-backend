const Joi = require("joi");

const signUpFormat = Joi.object({
  signUpToken: Joi.string().pattern(
    /^[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.[A-Za-z0-9-_.+/=]*$/,
  ),
  nickname: Joi.string()
    .pattern(/^[\uAC00-\uD7AFa-zA-Z0-9_-]+$/)
    .min(3)
    .custom((value, helpers) => {
      const byteLength = Buffer.byteLength(value, "utf8");
      if (byteLength > 16) {
        return helpers.message(
          "Nickname must be less than or equal to 16 bytes",
        );
      }
      return value;
    }, "Byte Length Validation")
    .required(),
  password: Joi.string()
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{2,20}$/)
    .required(),
});

const emailFormat = Joi.object({
  email: Joi.string()
    .email({ tlds: { allow: false } })
    .min(5)
    .max(320)
    .pattern(/^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/)
    .required(),
});

const checkOTPFormat = Joi.object({
  email: Joi.string()
    .email({ tlds: { allow: false } })
    .min(5)
    .max(320)
    .pattern(/^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/)
    .required(),
  otp: Joi.number().integer().min(100000).max(999999).required(),
});

const emailAndPasswordFormat = Joi.object({
  email: Joi.string()
    .email({ tlds: { allow: false } })
    .min(5)
    .max(320)
    .pattern(/^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/)
    .required(),
  password: Joi.string()
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{2,20}$/)
    .required(),
});

const newPasswordFormat = Joi.object({
  forgotToken: Joi.string().pattern(
    /^[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.[A-Za-z0-9-_.+/=]*$/,
  ),
  password: Joi.string()
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{2,20}$/)
    .required(),
});

exports.AuthValidator = {
  emailFormat,
  signUpFormat,
  checkOTPFormat,
  emailAndPasswordFormat,
  newPasswordFormat,
};
