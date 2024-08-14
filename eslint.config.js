/* eslint-disable no-undef */
const globals = require("globals");

module.exports = [
  {
    languageOptions: {
      globals: globals.browser,
    },
    ignores: [
      'node_modules/',
      'db.js',
      'server.js',
      'test/**/*.js',
    ],
    rules: {
      "no-unused-vars": "warn",
      "no-undef": "error",
      "eqeqeq": "warn",
      "curly": "error",
      "no-console": "warn",
    },
  },
];
