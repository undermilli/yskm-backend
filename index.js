const cors = require("cors");
const express = require("express");
const methodOverride = require("method-override");
const helmet = require("helmet");
const expressWinston = require("express-winston");
const http = require("http");

const { ENV } = require("./configs/env.config");
const logger = require("./middlewares/winston-logger.middleware");
const connectDB = require("./connectDB");
const apiRouter = require("./routes/api.route");
const errorHandler = require("./middlewares/error-handler.middleware");
const { messages } = require("./constants/messages");
const { statusCodes } = require("./constants/codes");

const app = express();
const PORT = ENV.PORT || 8080;

connectDB();

app.use(cors());

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
server = http.createServer(app);

server.listen(PORT, () => {
  console.log(`HTTP server listening on port ${PORT}`);
});
