import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

// Make sure env vars are loaded
dotenv.config();

let transporter = null;

// Create transporter on first use
const getTransporter = () => {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      },
      tls: {
        rejectUnauthorized: false
      }
    });

    // Test connection
    transporter.verify((error, success) => {
      if (error) {
        console.log('❌ Gmail Email Error:', error.message);
        console.log('💡 Make sure EMAIL_USER and EMAIL_PASSWORD are set');
      } else {
        console.log('✅ Gmail Email Service Ready!');
      }
    });
  }
  return transporter;
};

// Initialize on startup
setTimeout(() => getTransporter(), 100);

export const sendPasswordResetEmail = async (email, resetToken, username) => {
  const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5000'}/reset-password?token=${resetToken}`;

  const mailOptions = {
    from: `"Legacy Academy 🎓" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: '🔐 Password Reset Request - Legacy Academy',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: 'Inter', -apple-system, sans-serif; background: #0a0a15; color: #ffffff; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 40px auto; background: linear-gradient(135deg, rgba(147,51,234,0.1), rgba(236,72,153,0.1)); border: 1px solid rgba(255,255,255,0.1); border-radius: 20px; padding: 40px; }
            .logo { text-align: center; font-size: 48px; font-weight: 900; font-style: italic; background: linear-gradient(to right, #a855f7, #ec4899); -webkit-background-clip: text; -webkit-text-fill-color: transparent; margin-bottom: 10px; }
            .subtitle { text-align: center; color: #9ca3af; margin-bottom: 30px; }
            h2 { color: #ffffff; margin-bottom: 20px; }
            p { color: #d1d5db; line-height: 1.6; margin-bottom: 20px; }
            .button { display: inline-block; background: linear-gradient(to right, #9333ea, #ec4899); color: white; padding: 16px 32px; text-decoration: none; border-radius: 12px; font-weight: bold; margin: 20px 0; box-shadow: 0 10px 40px rgba(147,51,234,0.3); }
            .button:hover { opacity: 0.9; }
            .warning { background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.3); padding: 15px; border-radius: 10px; margin: 20px 0; }
            .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 30px; padding-top: 20px; border-top: 1px solid rgba(255,255,255,0.1); }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="logo">LEGACY</div>
            <div class="subtitle">The Elite Academy</div>
            
            <h2>👋 Hi ${username}!</h2>
            <p>We received a request to reset your password for your Legacy Academy account.</p>
            <p>Click the button below to create a new password:</p>
            
            <div style="text-align: center;">
              <a href="${resetUrl}" class="button">🔐 Reset My Password</a>
            </div>
            
            <div class="warning">
              <p style="margin: 0;"><strong>⚠️ Security Notice:</strong></p>
              <p style="margin: 5px 0 0 0;">This link will expire in <strong>1 hour</strong>. If you didn't request this password reset, please ignore this email and your password will remain unchanged.</p>
            </div>
            
            <p style="color: #9ca3af; font-size: 14px;">Or copy and paste this link into your browser:<br><code style="background: rgba(255,255,255,0.05); padding: 8px; border-radius: 6px; display: inline-block; margin-top: 8px; word-break: break-all; font-size: 12px;">${resetUrl}</code></p>
            
            <div class="footer">
              <p><strong>Legacy Academy</strong> - The Elite Academy</p>
              <p>This is an automated email. Please do not reply.</p>
              <p style="margin-top: 10px;">© ${new Date().getFullYear()} Legacy Academy. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `
  };

  try {
    const info = await getTransporter().sendMail(mailOptions);
    console.log('✅ Password reset email sent to:', email);
    console.log('   Message ID:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Failed to send email to:', email);
    console.error('   Error:', error.message);
    throw error;
  }
};

export default getTransporter;
