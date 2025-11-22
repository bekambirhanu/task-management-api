const { body, query } = require('express-validator');


exports.validateRegistration = [
    body('email')
        .notEmpty()
        .isEmail()
        .normalizeEmail()
        .withMessage('please provide a valid email'),
    body('password')
        .notEmpty()
        .isLength({min: 8})
        .withMessage('Password must be at least 8 characters'),
    body('verify_key')
        .notEmpty().withMessage("empty key")
        .isString().withMessage("invalid key"),
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
        .notEmpty()
        .isEmail()
        .normalizeEmail()
        .withMessage('please provide a valid email'),
    body('password')
        .notEmpty()
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


exports.validateNewTask = [
    body('title')
        .notEmpty()
        .isString()
        .trim()
        .isLength({max: 100})
        .withMessage('invalid title. Title shouldn`t be empty or more than 100 letters'),
    body('description')
        .notEmpty()
        .isString()
        .trim()
        .isLength({max: 1000})
        .withMessage('invalid description. Description shouldn`t be empty or more than 1000 letters'),
    body('status')
        .notEmpty()
        .isString()
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

exports.validateModifierTask = [
    body('title')
        .optional()
        .notEmpty().withMessage('title cannot be empty')
        .trim()
        .isLength({max:100})
        .withMessage('invalid title data'),
    body('description')
        .optional()
        .notEmpty().withMessage('description cannot be empty')
        .trim()
        .isLength({max: 100})
        .withMessage('invalid description data'),
    body('status')
        .optional()
        .notEmpty().withMessage('status cannot be empty')
        .isIn(['todo', 'in-progress', 'done'])
        .withMessage('invalid status data'),
    body('priority')
        .optional()
        .notEmpty().withMessage('priority cannot be empty')
        .isIn(['low', 'medium', 'high'])
        .withMessage('invalid priority data'),
    body('dueDate')
        .optional()
        .notEmpty().withMessage('due date cannot be empty')
        .isISO8601().withMessage('date must be in ISO8601')
        .custom(isFutureDate)
        .withMessage('invalid Due Date data')
]

exports.validateAssignTask = [
    query('taskId')
        .isHexadecimal().withMessage('invalid task ID'),
    query('userId')
        .isHexadecimal().withMessage('invalid user ID'),
    query('type')
        .optional()
        .isIn(['deassign', 'assign'])
        .withMessage('invalid data')
]

exports.validateEmail = [
    body('email')
        .notEmpty().withMessage('email is empty!')
        .isEmail()
        .normalizeEmail()
        .withMessage("invalid email")
]

exports.validateRecoveryKey = [
    body('recovery_key')
        .notEmpty().withMessage("recovery key is empty")
        .isString().withMessage("Invalid recovery key")
]