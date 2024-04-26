const sgMail = require("@sendgrid/mail");
const { ENV } = require("../configs/env.config");

exports.mailSender = async (email, title, body) => {
  sgMail.setApiKey(ENV.SENDGRID_API_KEY);
  const msg = {
    to: email, // Change to your recipient
    from: ENV.MAIL_FROM, // Change to your verified sender
    subject: title,
    html: body,
  };
  sgMail
    .send(msg)
    .then(() => {
      console.log("Email sent");
    })
    .catch((error) => {
      console.error(error);
    });
  return msg;
};
