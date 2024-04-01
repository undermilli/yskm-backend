const express = require("express");
const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("../configs/swagger.config");
const authRouter = require("./auth.route");
const userRouter = require("./user.route");

const app = express();

app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use("/auth/", authRouter);
app.use("/user/", userRouter);

// 실험중
const dataRouter = require("./data.route");
app.use("/data/", dataRouter);
//

module.exports = app;
