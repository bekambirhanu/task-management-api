require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI;

const JWT_SECRET_TOKEN = process.env.JWT_SECRET_TOKEN;

const PORT = process.env.PORT;

const EMAIL = process.env.EMAIL;

const PASSWORD_SENDER_EMAIL = process.env.PASSWORD_SENDER_EMAIL;

const PASSWORD_SENDER_KEY = process.env.PASSWORD_SENDER_KEY;

const EMAIL_FROM = process.env.EMAIL_FROM;

const CLIENT_URL = process.env.CLIENT_URL;

const AWS_BUCKET_NAME = process.env.AWS_BUCKET_NAME;

const AWS_KEY_ID = process.env.AWS_KEY_ID;

const AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY;

const AWS_S3_URL = process.env.AWS_S3_URL;

const REDIS_URI = process.env.REDIS_URI;

module.exports = {
    MONGODB_URI,
    JWT_SECRET_TOKEN,
    PORT,
    PASSWORD_SENDER_EMAIL,
    PASSWORD_SENDER_KEY,
    EMAIL,
    EMAIL_FROM,
    CLIENT_URL,
    // aws configs
    AWS_BUCKET_NAME,
    AWS_KEY_ID,
    AWS_SECRET_ACCESS_KEY,
    AWS_S3_URL,
    // redis config
    REDIS_URI
};