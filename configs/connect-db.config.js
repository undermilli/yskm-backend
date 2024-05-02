const mongoose = require("mongoose");
const { ENV } = require("./env.config");

const connectDB = async () => {
  try {
    mongoose.set("strictQuery", false);
    await mongoose.connect(ENV.MONGODB_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
  } catch (err) {
    /* eslint-disable no-process-exit */
    console.error(err);
    process.exit(1);
  }
};

module.exports = connectDB;