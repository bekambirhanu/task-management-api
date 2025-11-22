require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI;

const JWT_SECRET_TOKEN = process.env.JWT_SECRET_TOKEN;

const PORT = process.env.PORT;

const EMAIL = process.env.EMAIL;

const PASSWORD_SENDER_EMAIL = process.env.PASSWORD_SENDER_EMAIL;

const PASSWORD_SENDER_KEY = process.env.PASSWORD_SENDER_KEY;

const EMAIL_FROM = process.env.EMAIL_FROM;

const CLIENT_URL = process.env.CLIENT_URL;


module.exports = {MONGODB_URI,
     JWT_SECRET_TOKEN,
    PORT, 
    PASSWORD_SENDER_EMAIL,
    PASSWORD_SENDER_KEY,
    EMAIL, EMAIL_FROM,
    CLIENT_URL
        };