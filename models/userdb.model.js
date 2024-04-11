/* eslint-disable func-names */
const mongoose = require("mongoose");

const userDbSchema = new mongoose.Schema(
  {
    IGN: {
      type: String,
      required: true,
    },
    YEAR: {
      type: Number,
      required: true,
    },
    POS: {
      type: String,
      required: true,
    },
    NAT: {
      type: String,
      required: true,
    },
    TEAM: {
      type: String,
      required: true,
    },
    BIRTH: {
      type: Date,
      required: true,
    },
    CHAMP1: {
      type: String,
      required: true,
    },
    CHAMP2: {
      type: String,
      required: true,
    },
    CHAMP3: {
      type: String,
      required: true,
    },
    LEAGUE: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  
  }
);

const UserDb = mongoose.model("UserDb", userDbSchema);

module.exports = UserDb;
