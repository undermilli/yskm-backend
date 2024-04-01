const { createLogger, transports, format } = require("winston");
require("winston-mongodb");

const logger = createLogger({
  transports: [
    new transports.Console(),
    new transports.MongoDB({
      db: process.env.MONGODB_URL,
      options: { useNewUrlParser: true, useUnifiedTopology: true },
      collection: "logs",
      level: "error",
    }),
  ],
  format: format.combine(
    format.json(),
    format.timestamp(),
    format.metadata(),
    format.prettyPrint(),
  ),
});

module.exports = logger;
