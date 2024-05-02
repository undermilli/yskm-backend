require("dotenv").config();
const cors = require("cors");
const express = require("express");
const methodOverride = require("method-override");
const helmet = require("helmet");
const expressWinston = require("express-winston");
const https = require("https");
const http = require("http");
const fs = require("fs");

const logger = require("./middlewares/winston-logger.middleware");
const connectDB = require("./connectDB");
const apiRouter = require("./routes/api.route");
const errorHandler = require("./middlewares/error-handler.middleware");
const { messages } = require("./constants/messages");
const { statusCodes } = require("./constants/codes");

const app = express();
const PORT = process.env.PORT || 8080;

connectDB();

if (process.env.NODE_ENV === "development") app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(
  expressWinston.logger({
    winstonInstance: logger,
    statusLevels: true,
  }),
);

// lets you use HTTP verbs such as PUT or DELETE
// in places where the client doesn't support it
app.use(methodOverride());

// secure apps by setting various HTTP headers
app.use(helmet());

app.use("/api/", apiRouter);

app.get("/", (req, res) => {
  res.json("Hi!");
});

app.all("*", (req, res) =>
  res.status(statusCodes.NOT_FOUND).send(messages.NOT_FOUND),
);

app.use(errorHandler);

let server;
if (process.env.NODE_ENV === "production") {
  // Use HTTPS in production
  const options = {
    key: fs.readFileSync(process.env.KEY),
    cert: fs.readFileSync(process.env.CERT),
  };
  server = https.createServer(options, app);
} else {
  server = http.createServer(app);
}

server.listen(PORT, () => {
  console.log(`HTTPS server listening on port ${PORT}`);
});
