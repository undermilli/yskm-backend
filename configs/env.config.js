require("dotenv").config();

const loadEnvVariable = (name) => {
  if (!process.env[name]) {
    console.warn(`Environment variable for ${name} is not set!`);
  }
  return process.env[name] || "";
};

exports.ENV = {
  NODE_ENV: loadEnvVariable("NODE_ENV"),
  PORT: loadEnvVariable("PORT"),
  JWT_SECRET: loadEnvVariable("JWT_SECRET"),
  JWT_ACCESS_DURATION: loadEnvVariable("JWT_ACCESS_DURATION"),
  JWT_REFRESH_DURATION: loadEnvVariable("JWT_REFRESH_DURATION"),
  OTP_EXPIRE_IN_MINS: loadEnvVariable("OTP_EXPIRE_IN_MINS"),
  MAIL_HOST: loadEnvVariable("MAIL_HOST"),
  MAIL_PORT: loadEnvVariable("MAIL_PORT"),
  MAIL_USER: loadEnvVariable("MAIL_USER"),
  MAIL_PASS: loadEnvVariable("MAIL_PASS"),
  MAIL_FROM: loadEnvVariable("MAIL_FROM"),
  SENDGRID_API_KEY: loadEnvVariable("SENDGRID_API_KEY"),
  MONGODB_URL: loadEnvVariable("MONGODB_URL"),
  SOCKET_CORS_ORIGIN: loadEnvVariable("SOCKET_CORS_ORIGIN"),
  KEY: loadEnvVariable("KEY"),
  CERT: loadEnvVariable("CERT"),
};
