const Joi = require("joi");

const updateUserValidator = Joi.object({
  email: Joi.string()
    .email({ tlds: { allow: false } })
    .allow("")
    .optional(),
  description: Joi.string().max(1000).allow("").optional(),
});

const updatePasswordValidator = Joi.object({
  oldPassword: Joi.string()
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{2,20}$/)
    .required(),
  newPassword: Joi.string()
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{2,20}$/)
    .required(),
});

module.exports = { updateUserValidator, updatePasswordValidator };
