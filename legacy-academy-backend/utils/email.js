import nodemailer from 'nodemailer';

// Create a reusable transporter object using the default SMTP transport
export const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_APP_PASSWORD, // Use App Password, not regular password
    },
});

export const sendPasswordResetEmail = async (to, resetToken, username) => {
    // Determine the frontend URL based on environment
    const frontendUrl = process.env.NODE_ENV === 'production' 
        ? 'https://legacyacademyintel.vercel.app' 
        : 'http://localhost:5173';
        
    const resetUrl = `${frontendUrl}/reset-password?token=${resetToken}`;

    const mailOptions = {
        from: `"Legacy Academy Intel" <${process.env.EMAIL_USER}>`,
        to: to,
        subject: 'Reset Your Legacy Academy Password',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #000; color: #fff;">
                <div style="text-align: center; margin-bottom: 20px;">
                    <h1 style="color: #D4AF37;">Legacy Academy Intel</h1>
                </div>
                <div style="background-color: #111; padding: 30px; border: 1px solid #333;">
                    <h2 style="color: #fff; margin-top: 0;">Password Reset Request</h2>
                    <p style="color: #ccc;">Agent ${username},</p>
                    <p style="color: #ccc;">We received a request to reset your clearance codes (password) for your Legacy Academy Intel account.</p>
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${resetUrl}" style="background-color: #D4AF37; color: #000; padding: 12px 24px; text-decoration: none; font-weight: bold; display: inline-block; text-transform: uppercase;">RESET PASSWORD</a>
                    </div>
                    <p style="color: #ccc;">If you did not request this, please ignore this email. Your clearance remains secure.</p>
                    <p style="color: #ccc;">This link will expire in 1 hour.</p>
                </div>
                <div style="text-align: center; margin-top: 20px; color: #666; font-size: 12px;">
                    <p>&copy; ${new Date().getFullYear()} Legacy Academy. All rights reserved.</p>
                </div>
            </div>
        `,
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log('Password reset email sent: %s', info.messageId);
        return info;
    } catch (error) {
        console.error('Error sending password reset email:', error);
        throw error;
    }
};