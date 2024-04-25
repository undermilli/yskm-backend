const nodemailer = require("nodemailer");
const { ENV } = require("../configs/env.config");

exports.mailSender = async (email, title, body) => {
  const transporter = nodemailer.createTransport({
    host: ENV.MAIL_HOST,
    port: ENV.MAIL_PORT,
    auth: {
      user: ENV.MAIL_USER,
      pass: ENV.MAIL_PASS,
    },
  });

  const info = await transporter.sendMail({
    from: ENV.MAIL_FROM,
    to: email,
    subject: title,
    html: body,
  });

  return info;
};
