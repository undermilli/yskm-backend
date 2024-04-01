const Joi = require("joi");

exports.authValidator = Joi.object({
  username: Joi.string()
    .pattern(/^[a-z0-9]+$/)
    .alphanum()
    .min(2)
    .max(15)
    .required(),
  password: Joi.string()
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{2,20}$/)
    .required(),
});
