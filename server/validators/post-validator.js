const { body } = require("express-validator");

exports.generateValidator = [
  body("content")
    .not()
    .isEmpty()
    .withMessage("Must provide some content")
    .trim()
    .escape(),
  body("timestamp").not().isEmpty().withMessage("Missing timestamp").escape(),
];

exports.generateValidatorUpdate = [
  body("content")
    .not()
    .isEmpty()
    .withMessage("Must provide some content")
    .trim()
    .escape(),
];
