import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail', // swap for a transactional provider (SendGrid/Mailgun) in production
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS, // must be a Gmail "App Password", not the real password
  },
});

/**
 * @param {Object} options
 * @param {string} options.to
 * @param {string} options.subject
 * @param {string} options.html
 */
const sendEmail = async ({ to, subject, html }) => {
  await transporter.sendMail({
    from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
    to,
    subject,
    html,
  });
};

export default sendEmail;
