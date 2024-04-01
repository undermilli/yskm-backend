const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    mongoose.set("strictQuery", false);
    await mongoose.connect(process.env.MONGODB_URL, {
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
