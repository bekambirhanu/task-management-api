const { body } = require('express-validator');


exports.validateRegistration = [
    body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('please provide a valid email'),
    body('password')
        .isLength({min: 8})
        .withMessage('Password must be at least 8 characters'),
    body('first_name')
        .notEmpty()
        .trim()
        .withMessage('First Name is required'),
    body('last_name')
        .notEmpty()
        .trim()
        .withMessage('Last Name is required'),
    body('sex')
        .notEmpty()
        .isIn(['male', 'female'])
        .withMessage('Invalid sex')
];


exports.validateLogin = [
    body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('please provide a valid email'),
    body('password')
        .isLength({min: 8})
        .withMessage('Password must be at least 8 characters'),
];


// custom date validator

const isFutureDate = (value) => {
  const inputDate = new Date(value);
  const now = new Date();
  // Set time to 00:00:00 for both dates to compare only the date part
  inputDate.setHours(0, 0, 0, 0);
  now.setHours(0, 0, 0, 0);

  if (isNaN(inputDate.getTime())) {
    throw new Error('Invalid date format');
  }

  if (inputDate <= now) {
    throw new Error('Date must be in the future');
  }
  return true;
};


exports.validateTask = [
    body('title')
        .isEmpty()
        .trim()
        .isLength({max: 100})
        .withMessage('invalid title. Title shouldn`t be empty or more than 100 letters'),
    body('description')
        .isEmpty()
        .trim()
        .isLength({max: 1000})
        .withMessage('invalid description. Description shouldn`t be empty or more than 1000 letters'),
    body('status')
        .isEmpty()
        .isIn(['todo', 'in-progress', 'done'])
        .withMessage('invalid status'),
    body('priority')
        .optional({ checkFalsy: true })
        .isIn(['high', 'medium', 'low'])
        .withMessage('invalid priority'),
    body('dueDate')
        .optional({checkFalsy: true})
        .isISO8601().withMessage('date must be in ISO8601')
        .custom(isFutureDate)
        .withMessage('date must be in the future'),
];