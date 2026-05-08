const path = require('path');
const ejs = require('ejs');
const axios = require('axios');
const nodemailer = require('nodemailer');
const env = require("dotenv");
env.config();



const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: {
        user: process.env.MAIL_USERNAME,
        pass: process.env.MAIL_PASSWORD,
    },
});


const sendConfirmationOtp = async (email, otp) => {
    try {
        const subject = 'Conformation OTP | RK';
        const sendFrom = `"RK" <${process.env.MAIL_FROM_ADDRESS}>`;
        const emailBody = await ejs.renderFile(path.join(__dirname, '..', 'registrationmail.ejs'), { otp });

        const mailOptions = {
            from: sendFrom,
            to: email,
            subject: subject,
            html: emailBody
        };
        const sendMail = await transporter.sendMail(mailOptions);

        if (sendMail.messageId) {
            return {
                status: true,
                message: 'Email sent successfully',
                messageId: sendMail.messageId
            };
        } else {
            return {
                status: false,
                message: 'Failed to send email'
            };
        }
    } catch (error) {
        console.error('Error sending email:', error);
        return {
            status: false,
            message: "Error in sending mail",
            error: error.message
        };
    }
};





const sendVerificationEmail = async (email) => {
    try {
        const subject = 'Registration Confirmation | Your App Name';
        const sendFrom = `"Case Management System" <${process.env.MAIL_FROM_ADDRESS}>`;
        const email_Body = await ejs.renderFile(path.join(__dirname, '..', 'views', 'emails', 'registrationMessage.ejs'), {});
        const mailOptions = {
            from: sendFrom,
            to: email,
            subject: subject,
            html: email_Body
        };

        const sendMail = await transporter.sendMail(mailOptions);
        if (sendMail.messageId) {
            return {
                status: true,
                message: 'Email sent successfully',
                messageId: sendMail.messageId
            };
        } else {
            // Return an object instead of using res
            return {
                status: false,
                message: "Failed to send registration email",
                error: 'No messageId received from the email API'
            };
        }
    } catch (error) {
        console.error('Error sending email via API:', error);
        // Return an object instead of using res
        return {
            status: false,
            message: "Error in sending mail",
            error: error.message
        };
    }
};






module.exports = { sendConfirmationOtp, sendVerificationEmail };
