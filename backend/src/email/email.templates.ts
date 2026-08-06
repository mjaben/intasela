/**
 * Intasela HTML Email Templates
 * Branded with Intasela styling (#ACC8A2 soft sage, #1A2517 deep olive, dark theme)
 */

const baseEmailLayout = (title: string, content: string) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #0f150e;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      color: #f4f4f5;
    }
    .wrapper {
      width: 100%;
      table-layout: fixed;
      background-color: #0f150e;
      padding: 40px 0;
    }
    .main {
      margin: 0 auto;
      width: 100%;
      max-width: 560px;
      background-color: #1A2517;
      border: 1px solid #283724;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 10px 10px -5px rgba(0, 0, 0, 0.4);
    }
    .header {
      padding: 32px 32px 24px 32px;
      text-align: center;
      border-bottom: 1px solid #283724;
      background: linear-gradient(180deg, rgba(172, 200, 162, 0.08) 0%, rgba(26, 37, 23, 0) 100%);
    }
    .brand-logo {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      text-decoration: none;
    }
    .logo-badge {
      width: 36px;
      height: 36px;
      background-color: #ACC8A2;
      border-radius: 8px;
      color: #1A2517;
      font-weight: 800;
      font-size: 18px;
      line-height: 36px;
      text-align: center;
      display: inline-block;
    }
    .brand-name {
      color: #ffffff;
      font-size: 24px;
      font-weight: 700;
      letter-spacing: -0.5px;
      margin-left: 6px;
    }
    .content {
      padding: 32px;
    }
    .title {
      font-size: 22px;
      font-weight: 700;
      color: #ffffff;
      margin-top: 0;
      margin-bottom: 12px;
      line-height: 1.3;
    }
    .text {
      font-size: 15px;
      line-height: 1.6;
      color: #a1b899;
      margin-top: 0;
      margin-bottom: 24px;
    }
    .otp-box {
      background-color: #0f150e;
      border: 1px solid #ACC8A2;
      border-radius: 12px;
      padding: 20px;
      text-align: center;
      margin: 28px 0;
      box-shadow: 0 0 15px rgba(172, 200, 162, 0.15);
    }
    .otp-code {
      font-family: 'Courier New', Courier, monospace;
      font-size: 36px;
      font-weight: 800;
      letter-spacing: 8px;
      color: #ACC8A2;
      margin: 0;
    }
    .btn {
      display: inline-block;
      background-color: #ACC8A2;
      color: #1A2517;
      font-weight: 700;
      font-size: 15px;
      padding: 14px 28px;
      border-radius: 9999px;
      text-decoration: none;
      text-align: center;
      transition: background-color 0.2s;
    }
    .footer {
      padding: 24px 32px;
      text-align: center;
      border-top: 1px solid #283724;
      background-color: #141c12;
    }
    .footer-text {
      font-size: 12px;
      color: #71717a;
      line-height: 1.5;
      margin: 0;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="main">
      <div class="header">
        <div class="brand-logo">
          <span class="logo-badge">In</span>
          <span class="brand-name">tasela</span>
        </div>
      </div>
      <div class="content">
        ${content}
      </div>
      <div class="footer">
        <p class="footer-text">© ${new Date().getFullYear()} Intasela Inc. All rights reserved.</p>
        <p class="footer-text" style="margin-top: 4px;">If you didn't request this email, you can safely ignore it.</p>
      </div>
    </div>
  </div>
</body>
</html>
`;

export const registrationOtpTemplate = (otp: string) => {
  const content = `
    <h1 class="title">Verify Your Email Address</h1>
    <p class="text">Welcome to Intasela! Use the 6-digit verification code below to complete your registration:</p>
    <div class="otp-box">
      <div class="otp-code">${otp}</div>
    </div>
    <p class="text" style="font-size: 13px; color: #71717a;">This verification code is valid for 15 minutes. Never share this code with anyone.</p>
  `;
  return baseEmailLayout("Verify Registration - Intasela", content);
};

export const welcomeEmailTemplate = (name: string) => {
  const content = `
    <h1 class="title">Welcome to Intasela, ${name}! 🎉</h1>
    <p class="text">We're excited to have you on board. Intasela is your home to create, connect, build communities in Spaces, and earn from your content.</p>
    <p class="text">Here is what you can do right away:</p>
    <ul style="color: #a1b899; font-size: 15px; line-height: 1.8; padding-left: 20px; margin-bottom: 28px;">
      <li><strong style="color: #ffffff;">Create Selas:</strong> Share your thoughts, images, and videos.</li>
      <li><strong style="color: #ffffff;">Join Spaces:</strong> Discover vibrant creator communities.</li>
      <li><strong style="color: #ffffff;">Monetize:</strong> Earn revenue directly in your Creator Wallet as users engage.</li>
    </ul>
    <div style="text-align: center; margin: 32px 0 16px 0;">
      <a href="https://intasela.com" class="btn">Explore Intasela</a>
    </div>
  `;
  return baseEmailLayout("Welcome to Intasela!", content);
};

export const forgotPasswordOtpTemplate = (otp: string) => {
  const content = `
    <h1 class="title">Reset Your Password</h1>
    <p class="text">We received a request to reset your password for your Intasela account. Enter the 6-digit code below to proceed:</p>
    <div class="otp-box">
      <div class="otp-code">${otp}</div>
    </div>
    <p class="text" style="font-size: 13px; color: #71717a;">This code will expire in 15 minutes. If you did not request a password reset, please ignore this email or contact support immediately.</p>
  `;
  return baseEmailLayout("Reset Password Code - Intasela", content);
};

export const emailUpdateOtpTemplate = (otp: string) => {
  const content = `
    <h1 class="title">Confirm Email Address Change</h1>
    <p class="text">You requested to update your email address on Intasela. Please use the verification code below to confirm this change:</p>
    <div class="otp-box">
      <div class="otp-code">${otp}</div>
    </div>
    <p class="text" style="font-size: 13px; color: #71717a;">This code is valid for 15 minutes.</p>
  `;
  return baseEmailLayout("Confirm Email Change - Intasela", content);
};

export const payoutNotificationTemplate = (amount: number, status: string) => {
  const formattedAmount = new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(amount);
  const content = `
    <h1 class="title">Payout Update</h1>
    <p class="text">Your withdrawal request status has been updated:</p>
    <div style="background-color: #0f150e; border: 1px solid #283724; border-radius: 12px; padding: 20px; margin: 24px 0;">
      <div style="font-size: 13px; color: #71717a; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">Amount</div>
      <div style="font-size: 28px; font-weight: 800; color: #ffffff; margin: 4px 0 12px 0;">${formattedAmount}</div>
      <div style="font-size: 13px; color: #71717a; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">Status</div>
      <div style="font-size: 16px; font-weight: 700; color: ${status === 'COMPLETED' ? '#ACC8A2' : '#f59e0b'}; margin-top: 4px;">${status}</div>
    </div>
    <p class="text">You can track your earnings and transaction history at any time in your Creator Studio.</p>
  `;
  return baseEmailLayout("Payout Notification - Intasela", content);
};
