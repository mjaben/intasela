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
      background-color: #050505;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
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
    .main-container {
      width: 100%;
      max-width: 600px;
      margin: 0 auto;
      background-color: #0A0A0A;
      border-radius: 24px;
      overflow: hidden;
      border: 1px solid #1A2517;
      box-shadow: 0 20px 40px rgba(0,0,0,0.4);
    }
    .content-area {
      padding: 40px 48px;
    }
    @media screen and (max-width: 600px) {
      .main-container {
        border-radius: 0 !important;
        border: none !important;
      }
      .content-area {
        padding: 32px 24px !important;
      }
    }
  </style>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
</head>
<body style="margin: 0; padding: 0; background-color: #050505; color: #E5E5E5;">
  
  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #050505; padding: 40px 0;">
    <tr>
      <td align="center">
        <!-- Main Card -->
        <table class="main-container" border="0" cellpadding="0" cellspacing="0" width="600" style="background-color: #0A0A0A; border: 1px solid #1A2517; border-radius: 24px; overflow: hidden;">
          
          <!-- Header / Logo -->
          <tr>
            <td align="center" style="padding: 40px 40px 0 40px;">
              <table border="0" cellpadding="0" cellspacing="0" role="presentation">
                <tr>
                  <!-- Badge "In" -->
                  <td align="center" valign="middle" style="background-color: #ACC8A2; color: #1A2517; font-weight: 800; font-size: 20px; width: 44px; height: 44px; border-radius: 12px; text-align: center; font-family: 'Inter', sans-serif; box-shadow: 0 4px 14px rgba(172, 200, 162, 0.2);">
                    In
                  </td>
                  <!-- Text "tasela" -->
                  <td align="left" valign="middle" style="color: #ffffff; font-size: 28px; font-weight: 800; letter-spacing: -1px; padding-left: 8px; font-family: 'Inter', sans-serif;">
                    tasela
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td class="content-area" style="padding: 40px 48px;">
              ${content}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding: 32px 48px; background-color: #050505; border-top: 1px solid #1A2517;">
              <p style="font-size: 13px; color: #71717A; line-height: 1.6; margin: 0; font-family: 'Inter', sans-serif;">
                &copy; ${new Date().getFullYear()} Intasela Inc. All rights reserved.
              </p>
              <p style="font-size: 13px; color: #71717A; line-height: 1.6; margin: 8px 0 0 0; font-family: 'Inter', sans-serif;">
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
\`;

export const registrationOtpTemplate = (otp: string) => {
  const content = \`
    <h1 style="font-size: 26px; font-weight: 800; color: #ffffff; margin-top: 0; margin-bottom: 16px; line-height: 1.3; font-family: 'Inter', sans-serif; letter-spacing: -0.5px; text-align: center;">Verify Your Email</h1>
    <p style="font-size: 16px; line-height: 1.6; color: #A1A1AA; margin-top: 0; margin-bottom: 32px; font-family: 'Inter', sans-serif; text-align: center;">Welcome to Intasela! Use the 6-digit verification code below to complete your registration:</p>
    
    <div style="background: linear-gradient(145deg, #131911 0%, #0A0A0A 100%); border: 1px solid #283724; border-radius: 16px; padding: 32px; text-align: center; margin: 0 0 32px 0;">
      <div style="font-family: 'Courier New', Courier, monospace; font-size: 42px; font-weight: 800; letter-spacing: 12px; color: #ACC8A2; margin: 0; margin-right: -12px;">\${otp}</div>
    </div>
    
    <p style="font-size: 14px; line-height: 1.6; color: #71717A; font-family: 'Inter', sans-serif; text-align: center; margin: 0;">This verification code is valid for 15 minutes. Never share this code with anyone.</p>
  \`;
  return baseEmailLayout("Verify Registration - Intasela", content);
};

export const welcomeEmailTemplate = (name: string) => {
  const content = \`
    <h1 style="font-size: 26px; font-weight: 800; color: #ffffff; margin-top: 0; margin-bottom: 16px; line-height: 1.3; font-family: 'Inter', sans-serif; letter-spacing: -0.5px;">Welcome to Intasela, \${name}! 🎉</h1>
    <p style="font-size: 16px; line-height: 1.6; color: #A1A1AA; margin-top: 0; margin-bottom: 24px; font-family: 'Inter', sans-serif;">We're thrilled to have you on board. Intasela is your new home to create, connect, build communities in Spaces, and earn directly from your content.</p>
    
    <div style="background-color: #131911; border-left: 4px solid #ACC8A2; border-radius: 0 12px 12px 0; padding: 24px; margin-bottom: 32px;">
      <h3 style="color: #ffffff; font-size: 16px; font-weight: 700; margin: 0 0 16px 0; font-family: 'Inter', sans-serif;">What's next?</h3>
      <ul style="color: #A1A1AA; font-size: 15px; line-height: 1.8; padding-left: 20px; margin: 0; font-family: 'Inter', sans-serif;">
        <li style="margin-bottom: 8px;"><strong style="color: #ACC8A2;">Create Selas:</strong> Share your thoughts, images, and videos.</li>
        <li style="margin-bottom: 8px;"><strong style="color: #ACC8A2;">Join Spaces:</strong> Discover vibrant creator communities.</li>
        <li><strong style="color: #ACC8A2;">Monetize:</strong> Earn revenue seamlessly as users engage.</li>
      </ul>
    </div>
    
    <div style="text-align: center; margin: 40px 0 16px 0;">
      <a href="https://intasela.com" style="display: inline-block; background-color: #ACC8A2; color: #1A2517; font-weight: 700; font-size: 16px; padding: 16px 32px; border-radius: 9999px; text-decoration: none; text-align: center; font-family: 'Inter', sans-serif; box-shadow: 0 8px 24px rgba(172, 200, 162, 0.25);">Explore Intasela</a>
    </div>
  \`;
  return baseEmailLayout("Welcome to Intasela!", content);
};

export const forgotPasswordOtpTemplate = (otp: string) => {
  const content = \`
    <h1 style="font-size: 26px; font-weight: 800; color: #ffffff; margin-top: 0; margin-bottom: 16px; line-height: 1.3; font-family: 'Inter', sans-serif; letter-spacing: -0.5px; text-align: center;">Reset Your Password</h1>
    <p style="font-size: 16px; line-height: 1.6; color: #A1A1AA; margin-top: 0; margin-bottom: 32px; font-family: 'Inter', sans-serif; text-align: center;">We received a request to reset your password. Enter the 6-digit code below to proceed:</p>
    
    <div style="background: linear-gradient(145deg, #131911 0%, #0A0A0A 100%); border: 1px solid #283724; border-radius: 16px; padding: 32px; text-align: center; margin: 0 0 32px 0;">
      <div style="font-family: 'Courier New', Courier, monospace; font-size: 42px; font-weight: 800; letter-spacing: 12px; color: #ACC8A2; margin: 0; margin-right: -12px;">\${otp}</div>
    </div>
    
    <p style="font-size: 14px; line-height: 1.6; color: #71717A; font-family: 'Inter', sans-serif; text-align: center; margin: 0;">This code will expire in 15 minutes. If you did not request a password reset, please ignore this email or contact support immediately.</p>
  \`;
  return baseEmailLayout("Reset Password Code - Intasela", content);
};

export const emailUpdateOtpTemplate = (otp: string) => {
  const content = \`
    <h1 style="font-size: 26px; font-weight: 800; color: #ffffff; margin-top: 0; margin-bottom: 16px; line-height: 1.3; font-family: 'Inter', sans-serif; letter-spacing: -0.5px; text-align: center;">Confirm Email Change</h1>
    <p style="font-size: 16px; line-height: 1.6; color: #A1A1AA; margin-top: 0; margin-bottom: 32px; font-family: 'Inter', sans-serif; text-align: center;">You requested to update your email address on Intasela. Please use the verification code below to confirm this change:</p>
    
    <div style="background: linear-gradient(145deg, #131911 0%, #0A0A0A 100%); border: 1px solid #283724; border-radius: 16px; padding: 32px; text-align: center; margin: 0 0 32px 0;">
      <div style="font-family: 'Courier New', Courier, monospace; font-size: 42px; font-weight: 800; letter-spacing: 12px; color: #ACC8A2; margin: 0; margin-right: -12px;">\${otp}</div>
    </div>
    
    <p style="font-size: 14px; line-height: 1.6; color: #71717A; font-family: 'Inter', sans-serif; text-align: center; margin: 0;">This code is valid for 15 minutes.</p>
  \`;
  return baseEmailLayout("Confirm Email Change - Intasela", content);
};

export const payoutNotificationTemplate = (amount: number, status: string) => {
  const formattedAmount = new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(amount);
  const statusColor = status === 'COMPLETED' ? '#ACC8A2' : '#f59e0b';
  const content = `
    <h1 style="font-size: 26px; font-weight: 800; color: #ffffff; margin-top: 0; margin-bottom: 16px; line-height: 1.3; font-family: 'Inter', sans-serif; letter-spacing: -0.5px; text-align: center;">Payout Update</h1>
    <p style="font-size: 16px; line-height: 1.6; color: #A1A1AA; margin-top: 0; margin-bottom: 32px; font-family: 'Inter', sans-serif; text-align: center;">Your withdrawal request status has been updated:</p>
    
    <div style="background: linear-gradient(145deg, #131911 0%, #0A0A0A 100%); border: 1px solid #283724; border-radius: 16px; padding: 32px; text-align: center; margin: 0 0 32px 0;">
      <div style="font-size: 14px; color: #A1A1AA; text-transform: uppercase; letter-spacing: 2px; font-weight: 700; font-family: 'Inter', sans-serif;">Amount</div>
      <div style="font-size: 36px; font-weight: 800; color: #ffffff; margin: 8px 0 24px 0; font-family: 'Inter', sans-serif;">${formattedAmount}</div>
      <div style="font-size: 14px; color: #A1A1AA; text-transform: uppercase; letter-spacing: 2px; font-weight: 700; font-family: 'Inter', sans-serif;">Status</div>
      <div style="font-size: 18px; font-weight: 800; color: ${statusColor}; margin-top: 8px; font-family: 'Inter', sans-serif;">${status}</div>
    </div>
    
    <p style="font-size: 15px; line-height: 1.6; color: #71717A; font-family: 'Inter', sans-serif; text-align: center; margin: 0;">You can track your earnings and transaction history at any time in your Creator Studio.</p>
  `;
  return baseEmailLayout("Payout Notification - Intasela", content);
};
