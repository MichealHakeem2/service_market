const bcrypt = require('bcryptjs');
const {
  body,
  validationResult
} = require('express-validator');
const User = require('../models/Users');
const Category = require('../models/Category');

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      errors: errors.array()
    });
  }
  next();
};

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
  .optional()
  .isIn(['customer', 'provider', 'admin', 'adminuser']).withMessage('Invalid role'),
  validate
];

exports.loginValidation = [
  body('email').notEmpty().withMessage('Email is required').isEmail().withMessage('Invalid email format'),
  body('password').notEmpty().withMessage('Password is required'),
  validate
];

exports.updatePasswordValidation = [
  body('password').notEmpty().withMessage('Password is required').isLength({
    min: 8
  }).withMessage('Password must be at least 8 characters'),
  validate
];

exports.providerRegisterValidation = [
  body('name').notEmpty().withMessage('name is required'),
  body('email').notEmpty().withMessage('Email is required').isEmail().withMessage('Invalid email format'),
  body('password').notEmpty().withMessage('Password is required').isLength({
    min: 8
  }).withMessage('Password must be at least 8 characters'),
  body('phone').notEmpty().withMessage('Phone is required'),
  body('categoryId').optional({
    checkFalsy: true
  }).isInt().withMessage('Category ID must be an integer'),
  body('subcategoryId').optional({
    checkFalsy: true
  }).isInt().withMessage('Subcategory ID must be an integer'),
  validate
];

exports.categoryValidation = [
  body('name').notEmpty().withMessage('Category name is required'),
  validate
];

exports.subcategoryValidation = [
  body('categoryId').notEmpty().withMessage('Category ID is required').isInt(),
  body('name').notEmpty().withMessage('Subcategory name is required'),
  validate
];

exports.serviceValidation = [
  body('categoryId').notEmpty().withMessage('Category ID is required').isInt(),
  body('subcategoryId').notEmpty().withMessage('Subcategory ID is required').isInt(),
  body('service_title_id').notEmpty().withMessage('Service title ID is required').isInt(),
  body('price').notEmpty().withMessage('Price is required').isNumeric(),
  body('price_Type').optional().isIn(['Fixed', 'Hourly', 'Starting From']).withMessage('Invalid price type'),
  validate
];

exports.bookingValidation = [
  body('provider_id').notEmpty().withMessage('Provider ID is required').isInt(),
  body('service_id').notEmpty().withMessage('Service ID is required').isInt(),
  body('booking_date').notEmpty().withMessage('Booking date is required').isDate().withMessage('Invalid date format'),
  body('booking_time').notEmpty().withMessage('Booking time is required').matches(/^([01]\d|2[0-3]):?([0-5]\d)$/).withMessage('Invalid time format (HH:mm)'),
  body('hours').optional().isNumeric().withMessage('Hours must be a number'),
  validate
];

exports.statusUpdateValidation = [
  body('status').notEmpty().withMessage('Status is required'),
  validate
];