module.exports = {
  env: {
    node: true,
    es6: true,
  },
  extends: ["airbnb-base", "plugin:node/recommended", "prettier"],
  plugins: ["import", "node", "prettier"],
  rules: {
    "prettier/prettier": ["error", { endOfLine: "auto" }],
    "no-console": "off",
  },
};
