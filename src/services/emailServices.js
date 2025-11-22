const nodemailer = require('nodemailer');
const { EMAIL_SERVICE, PASSWORD_SENDER_EMAIL, PASSWORD_SENDER_KEY, CLIENT_URL, EMAIL_FROM } = require('../../envVars');

class EmailService {
    constructor() {
        this.transporter = nodemailer.createTransport({
            //service: EMAIL_SERVICE || 'Gmail',
            host: "smtp.ethereal.email",
            port: 587,
            secure: false,
            auth: {
                user: PASSWORD_SENDER_EMAIL,
                pass: PASSWORD_SENDER_KEY
            }
        })
    };

    async sendPasswordReset(email, name, resetToken) {
        const resetUrl = `${CLIENT_URL}/reset-password?token=${resetToken}`;
        
        const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Password Reset Request</h2>
            <p>Hello ${name},</p>
            <h1><bold>Token: ${resetToken}</bold></h1>
            <p><small>This token will expire in 1 hour.</small></p>
            <p>If you didn't request this, please ignore this email.</p>
        </div>
        `;

        const mailOptions = {
            from: EMAIL_FROM,
            to: email,
            subject: 'Password Reset Request - Task Manager',
            html: html
        };

        return await this.transporter.sendMail(mailOptions);
    };

    async verifyEmail(email, verifyToken) {

        const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Email Verification Request</h2>
            <p>Hello,</p>
            <h1><bold>Verification Token: ${verifyToken}</bold></h1>
            <p><small>This token will expire in 1 hour.</small></p>
            <p>If you didn't request this, please ignore this email.</p>
        </div>
        `;

        const mailOptions = {
            from: EMAIL_FROM,
            to: email,
            subject: 'Email Verification Request - Task Manager',
            html: html
        };

        return await this.transporter.sendMail(mailOptions);

    }
};

module.exports = new EmailService();