const bcrypt = require('bcrypt');
const {
  body,
  validationResult
} = require('express-validator');
const User = require('../models/Users');
exports.registerValidation = [
  body('name')
  .notEmpty().withMessage('name is required')
  .isLength({
    min: 3
  }).withMessage('name must be at least 3 characters'),
  body('email')
  .notEmpty().withMessage('Email is required')
  .isEmail().withMessage('Invalid email format'),
  body('password')
  .notEmpty().withMessage('Password is required')
  .isLength({
    min: 8
  }).withMessage('Password must be at least 8 characters'),
  body('phone')
  .notEmpty().withMessage('Phone is required')
  .isLength({
    min: 11
  }).withMessage('Phone must be at least 11 characters'),
  body('role')
  .notEmpty().withMessage('Role is required. Role must be customer, provider, admin, or adminuser'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        errors: errors.array()
      });
    }
    next();
  }
];
exports.loginValidation = [
  body('email')
  .notEmpty().withMessage('Email is required')
  .isEmail().withMessage('Invalid email format'),
  body('password')
  .notEmpty().withMessage('Password is required')
  .isLength({
    min: 8
  }).withMessage('Password must be at least 4 characters'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        errors: errors.array()
      });
    }
    next();
  }
];
exports.updatePasswordValidation = [
  body('password')
  .notEmpty().withMessage('Password is required')
  .isLength({
    min: 8
  }).withMessage('Password must be at least 8 characters'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        errors: errors.array()
      });
    }
    next();
  }
];
exports.providerRegisterValidation = [
  body('name')
  .notEmpty().withMessage('name is required')
  .isLength({
    min: 3
  }).withMessage('name must be at least 3 characters'),
  body('email')
  .notEmpty().withMessage('Email is required')
  .isEmail().withMessage('Invalid email format'),
  body('password')
  .notEmpty().withMessage('Password is required')
  .isLength({
    min: 8
  }).withMessage('Password must be at least 8 characters'),
  body('phone')
  .notEmpty().withMessage('Phone is required')
  .isLength({
    min: 11
  }).withMessage('Phone must be at least 11 characters'),
  body('categoryId')
  .notEmpty().withMessage('Category is required'),
  body('subcategoryId')
  .notEmpty().withMessage('Subcategory is required'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        errors: errors.array()
      });
    }
    next();
  }
];