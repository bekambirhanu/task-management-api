const { EMAIL_SERVICE, EMAIL_FROM, PASSWORD_SENDER_EMAIL, PASSWORD_SENDER_KEY } = require('../../envVars');

module.exports = {
    service: EMAIL_SERVICE || 'Gmail',
    auth: {
        user: PASSWORD_SENDER_EMAIL,
        pass: PASSWORD_SENDER_KEY
    },
    from: EMAIL_FROM || 'noreply@taskmanager.com'
};