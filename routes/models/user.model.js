/* eslint-disable func-names */
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      minlength: 2,
      maxlength: 15,
      match: /^[a-z0-9]+$/,
    },
    password: {
      type: String,
      required: true,
      minlength: 60,
      maxlength: 60,
    },
    userNumber: {
      type: Number,
      unique: true,
    },
    score: {
      type: Number,
      default: 0,
    },
    scoreLastUpdate: {
      type: Date,
      default: Date.now,
    },
    description: {
      type: String,
      default: "",
      maxlength: 1000,
    },
    email: {
      type: String,
      default: "",
      match: /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/,
    },
    lastVisited: {
      type: Date,
      default: Date.now,
    },
    refreshTokens: [
      {
        token: {
          type: String,
          required: true,
        },
        expiresIn: {
          type: Date,
          required: true,
        },
      },
    ],
  },
  {
    timestamps: true,
  },
);

userSchema.pre("save", async function (next) {
  if (!this.userNumber) {
    try {
      const lastUser = await this.constructor.findOne(
        {},
        {},
        { sort: { userNumber: -1 } },
      );
      const newNumber = lastUser ? lastUser.userNumber + 1 : 10000000;
      this.userNumber = newNumber;
      next();
    } catch (error) {
      next(error);
    }
  } else {
    next();
  }
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.generateAccessToken = function () {
  const tokenPayload = {
    // eslint-disable-next-line no-underscore-dangle
    userId: this._id,
  };

  return jwt.sign(tokenPayload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_ACCESS_DURATION,
  });
};

userSchema.methods.generateRefreshToken = function () {
  const refreshTokenPayload = {
    username: this.username,
  };

  const refreshToken = jwt.sign(refreshTokenPayload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_REFRESH_DURATION,
  });

  if (this.refreshTokens.length > 0) {
    const lastRefreshToken = this.refreshTokens[this.refreshTokens.length - 1];
    lastRefreshToken.token = refreshToken;
    lastRefreshToken.expiresIn = new Date(
      Date.now() + 30 * 24 * 60 * 60 * 1000,
    );
  } else {
    this.refreshTokens.push({
      token: refreshToken,
      expiresIn: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    });
  }

  return refreshToken;
};

const User = mongoose.model("User", userSchema);

module.exports = User;
