/**
 * Intasela HTML Email Templates
 * Branded with Intasela styling (#ACC8A2 soft sage, #1A2517 deep olive, dark theme)
 */

const baseEmailLayout = (title: string, content: string) => `
<!DOCTYPE html>
<html lang="en" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
  <style>
    body {
      margin: 0;
      padding: 0;
      -webkit-text-size-adjust: 100%;
      -ms-text-size-adjust: 100%;
      background-color: #0f150e;
    }
    table, td {
      border-collapse: collapse;
      mso-table-lspace: 0pt;
      mso-table-rspace: 0pt;
    }
    img {
      border: 0;
      height: auto;
      line-height: 100%;
      outline: none;
      text-decoration: none;
      -ms-interpolation-mode: bicubic;
    }
    @media screen and (max-width: 600px) {
      .main-container {
        width: 100% !important;
        border-radius: 0 !important;
        border: none !important;
      }
      .content-padding {
        padding: 24px 16px !important;
      }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #0f150e; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  
  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #0f150e; padding: 40px 0;">
    <tr>
      <td align="center">
        <!-- Main Card -->
        <table class="main-container" border="0" cellpadding="0" cellspacing="0" width="560" style="background-color: #1A2517; border: 1px solid #283724; border-radius: 16px; overflow: hidden; max-width: 560px; width: 100%;">
          
          <!-- Header / Logo -->
          <tr>
            <td align="center" style="padding: 32px 32px 24px 32px; border-bottom: 1px solid #283724; background-color: #162013;">
              <table border="0" cellpadding="0" cellspacing="0" role="presentation">
                <tr>
                  <!-- Badge "In" -->
                  <td align="center" valign="middle" style="background-color: #ACC8A2; color: #1A2517; font-weight: 800; font-size: 18px; width: 36px; height: 36px; border-radius: 8px; text-align: center; font-family: sans-serif;">
                    In
                  </td>
                  <!-- Text "tasela" -->
                  <td align="left" valign="middle" style="color: #ffffff; font-size: 24px; font-weight: 700; letter-spacing: -0.5px; padding-left: 6px; font-family: sans-serif;">
                    tasela
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td class="content-padding" style="padding: 32px; color: #f4f4f5;">
              ${content}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding: 24px 32px; border-top: 1px solid #283724; background-color: #141c12;">
              <p style="font-size: 12px; color: #71717a; line-height: 1.5; margin: 0; font-family: sans-serif;">
                &copy; ${new Date().getFullYear()} Intasela Inc. All rights reserved.
              </p>
              <p style="font-size: 12px; color: #71717a; line-height: 1.5; margin: 4px 0 0 0; font-family: sans-serif;">
                If you didn't request this email, you can safely ignore it.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>

</body>
</html>
`;

export const registrationOtpTemplate = (otp: string) => {
  const content = `
    <h1 style="font-size: 22px; font-weight: 700; color: #ffffff; margin-top: 0; margin-bottom: 12px; line-height: 1.3; font-family: sans-serif;">Verify Your Email Address</h1>
    <p style="font-size: 15px; line-height: 1.6; color: #a1b899; margin-top: 0; margin-bottom: 24px; font-family: sans-serif;">Welcome to Intasela! Use the 6-digit verification code below to complete your registration:</p>
    <div style="background-color: #0f150e; border: 1px solid #ACC8A2; border-radius: 12px; padding: 20px; text-align: center; margin: 28px 0; box-shadow: 0 0 15px rgba(172, 200, 162, 0.15);">
      <div style="font-family: 'Courier New', Courier, monospace; font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #ACC8A2; margin: 0;">${otp}</div>
    </div>
    <p style="font-size: 13px; line-height: 1.6; color: #71717a; font-family: sans-serif;">This verification code is valid for 15 minutes. Never share this code with anyone.</p>
  `;
  return baseEmailLayout("Verify Registration - Intasela", content);
};

export const welcomeEmailTemplate = (name: string) => {
  const content = `
    <h1 style="font-size: 22px; font-weight: 700; color: #ffffff; margin-top: 0; margin-bottom: 12px; line-height: 1.3; font-family: sans-serif;">Welcome to Intasela, ${name}! 🎉</h1>
    <p style="font-size: 15px; line-height: 1.6; color: #a1b899; margin-top: 0; margin-bottom: 24px; font-family: sans-serif;">We're excited to have you on board. Intasela is your home to create, connect, build communities in Spaces, and earn from your content.</p>
    <p style="font-size: 15px; line-height: 1.6; color: #a1b899; margin-top: 0; margin-bottom: 24px; font-family: sans-serif;">Here is what you can do right away:</p>
    <ul style="color: #a1b899; font-size: 15px; line-height: 1.8; padding-left: 20px; margin-bottom: 28px; font-family: sans-serif;">
      <li><strong style="color: #ffffff;">Create Selas:</strong> Share your thoughts, images, and videos.</li>
      <li><strong style="color: #ffffff;">Join Spaces:</strong> Discover vibrant creator communities.</li>
      <li><strong style="color: #ffffff;">Monetize:</strong> Earn revenue directly in your Creator Wallet as users engage.</li>
    </ul>
    <div style="text-align: center; margin: 32px 0 16px 0;">
      <a href="https://intasela.com" style="display: inline-block; background-color: #ACC8A2; color: #1A2517; font-weight: 700; font-size: 15px; padding: 14px 28px; border-radius: 9999px; text-decoration: none; text-align: center; font-family: sans-serif;">Explore Intasela</a>
    </div>
  `;
  return baseEmailLayout("Welcome to Intasela!", content);
};

export const forgotPasswordOtpTemplate = (otp: string) => {
  const content = `
    <h1 style="font-size: 22px; font-weight: 700; color: #ffffff; margin-top: 0; margin-bottom: 12px; line-height: 1.3; font-family: sans-serif;">Reset Your Password</h1>
    <p style="font-size: 15px; line-height: 1.6; color: #a1b899; margin-top: 0; margin-bottom: 24px; font-family: sans-serif;">We received a request to reset your password for your Intasela account. Enter the 6-digit code below to proceed:</p>
    <div style="background-color: #0f150e; border: 1px solid #ACC8A2; border-radius: 12px; padding: 20px; text-align: center; margin: 28px 0; box-shadow: 0 0 15px rgba(172, 200, 162, 0.15);">
      <div style="font-family: 'Courier New', Courier, monospace; font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #ACC8A2; margin: 0;">${otp}</div>
    </div>
    <p style="font-size: 13px; line-height: 1.6; color: #71717a; font-family: sans-serif;">This code will expire in 15 minutes. If you did not request a password reset, please ignore this email or contact support immediately.</p>
  `;
  return baseEmailLayout("Reset Password Code - Intasela", content);
};

export const emailUpdateOtpTemplate = (otp: string) => {
  const content = `
    <h1 style="font-size: 22px; font-weight: 700; color: #ffffff; margin-top: 0; margin-bottom: 12px; line-height: 1.3; font-family: sans-serif;">Confirm Email Address Change</h1>
    <p style="font-size: 15px; line-height: 1.6; color: #a1b899; margin-top: 0; margin-bottom: 24px; font-family: sans-serif;">You requested to update your email address on Intasela. Please use the verification code below to confirm this change:</p>
    <div style="background-color: #0f150e; border: 1px solid #ACC8A2; border-radius: 12px; padding: 20px; text-align: center; margin: 28px 0; box-shadow: 0 0 15px rgba(172, 200, 162, 0.15);">
      <div style="font-family: 'Courier New', Courier, monospace; font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #ACC8A2; margin: 0;">${otp}</div>
    </div>
    <p style="font-size: 13px; line-height: 1.6; color: #71717a; font-family: sans-serif;">This code is valid for 15 minutes.</p>
  `;
  return baseEmailLayout("Confirm Email Change - Intasela", content);
};

export const payoutNotificationTemplate = (amount: number, status: string) => {
  const formattedAmount = new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(amount);
  const content = `
    <h1 style="font-size: 22px; font-weight: 700; color: #ffffff; margin-top: 0; margin-bottom: 12px; line-height: 1.3; font-family: sans-serif;">Payout Update</h1>
    <p style="font-size: 15px; line-height: 1.6; color: #a1b899; margin-top: 0; margin-bottom: 24px; font-family: sans-serif;">Your withdrawal request status has been updated:</p>
    <div style="background-color: #0f150e; border: 1px solid #283724; border-radius: 12px; padding: 20px; margin: 24px 0;">
      <div style="font-size: 13px; color: #71717a; text-transform: uppercase; letter-spacing: 1px; font-weight: 600; font-family: sans-serif;">Amount</div>
      <div style="font-size: 28px; font-weight: 800; color: #ffffff; margin: 4px 0 12px 0; font-family: sans-serif;">${formattedAmount}</div>
      <div style="font-size: 13px; color: #71717a; text-transform: uppercase; letter-spacing: 1px; font-weight: 600; font-family: sans-serif;">Status</div>
      <div style="font-size: 16px; font-weight: 700; color: ${status === 'COMPLETED' ? '#ACC8A2' : '#f59e0b'}; margin-top: 4px; font-family: sans-serif;">${status}</div>
    </div>
    <p style="font-size: 15px; line-height: 1.6; color: #a1b899; margin-top: 0; margin-bottom: 24px; font-family: sans-serif;">You can track your earnings and transaction history at any time in your Creator Studio.</p>
  `;
  return baseEmailLayout("Payout Notification - Intasela", content);
};
