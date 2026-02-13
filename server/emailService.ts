// Email notification service using SendGrid connector
import { getUncachableSendGridClient } from './sendgridClient';

const APP_NAME = 'Mentorfy';
const APP_URL = 'https://mentor-fy.app';

function wrapInTemplate(content: string): string {
  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 0;">
      <div style="background: #6366f1; padding: 24px 32px;">
        <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700;">${APP_NAME}</h1>
      </div>
      <div style="padding: 32px; background: #ffffff; border: 1px solid #e5e7eb; border-top: none;">
        ${content}
      </div>
      <div style="padding: 20px 32px; background: #f9fafb; border: 1px solid #e5e7eb; border-top: none; text-align: center;">
        <p style="margin: 0; font-size: 12px; color: #9ca3af;">
          You're receiving this because you have an account on ${APP_NAME}.
          <br />
          <a href="${APP_URL}/settings" style="color: #6366f1;">Manage notification preferences</a>
        </p>
      </div>
    </div>
  `;
}

function actionButton(text: string, url: string): string {
  return `
    <div style="text-align: center; margin: 24px 0;">
      <a href="${url}" style="display: inline-block; background: #6366f1; color: #ffffff; padding: 12px 28px; border-radius: 6px; text-decoration: none; font-weight: 600; font-size: 14px;">${text}</a>
    </div>
  `;
}

async function sendEmail(to: string, subject: string, htmlContent: string): Promise<boolean> {
  try {
    const { client, fromEmail } = await getUncachableSendGridClient();
    await client.send({
      to,
      from: { email: fromEmail, name: APP_NAME },
      subject,
      html: htmlContent,
    });
    console.log(`[Email] Sent "${subject}" to ${to}`);
    return true;
  } catch (err: any) {
    console.error(`[Email] Failed to send "${subject}" to ${to}:`, err?.response?.body || err.message);
    return false;
  }
}

export const emailService = {
  async sendEmailChangedConfirmation(to: string, firstName: string): Promise<boolean> {
    const subject = `Your ${APP_NAME} email has been updated`;
    const html = wrapInTemplate(`
      <h2 style="color: #111827; margin: 0 0 16px;">Email Address Updated</h2>
      <p style="color: #4b5563; line-height: 1.6; margin: 0 0 16px;">
        Hi ${firstName}, your email address on ${APP_NAME} has been successfully changed to this address.
      </p>
      <p style="color: #4b5563; line-height: 1.6; margin: 0 0 16px;">
        If you did not make this change, please contact us immediately or reset your password.
      </p>
      ${actionButton('Go to Settings', `${APP_URL}/settings`)}
    `);
    return sendEmail(to, subject, html);
  },

  async sendWelcomeEmail(to: string, firstName: string, role: string): Promise<boolean> {
    const isMentor = role === 'mentor';
    const subject = `Welcome to ${APP_NAME}!`;
    const html = wrapInTemplate(`
      <h2 style="color: #111827; margin: 0 0 16px;">Welcome, ${firstName}!</h2>
      <p style="color: #4b5563; line-height: 1.6; margin: 0 0 16px;">
        Thanks for joining ${APP_NAME}. ${isMentor
          ? "You've signed up as a mentor. Complete your profile to start connecting with students who can benefit from your experience."
          : "You've signed up as a mentee. Start exploring events and connecting with mentors who can guide your career journey."
        }
      </p>
      <p style="color: #4b5563; line-height: 1.6; margin: 0 0 8px;">Here's how to get started:</p>
      <ul style="color: #4b5563; line-height: 1.8; margin: 0 0 16px; padding-left: 20px;">
        ${isMentor
          ? `<li>Complete your mentor profile with your company, role, and expertise</li>
             <li>Browse upcoming career events and RSVP</li>
             <li>Wait for students to send connection requests</li>`
          : `<li>Complete your profile with your interests and target companies</li>
             <li>Browse upcoming career events and RSVP</li>
             <li>Find and connect with mentors in your field</li>`
        }
      </ul>
      ${actionButton(isMentor ? 'Complete Your Profile' : 'Explore Events', isMentor ? `${APP_URL}/onboarding` : `${APP_URL}/events`)}
    `);
    return sendEmail(to, subject, html);
  },

  async sendConnectionRequestEmail(to: string, mentorName: string, menteeName: string, message?: string): Promise<boolean> {
    const subject = `${menteeName} wants to connect with you`;
    const html = wrapInTemplate(`
      <h2 style="color: #111827; margin: 0 0 16px;">New Connection Request</h2>
      <p style="color: #4b5563; line-height: 1.6; margin: 0 0 16px;">
        Hi ${mentorName}, <strong>${menteeName}</strong> has sent you a connection request on ${APP_NAME}.
      </p>
      ${message ? `
        <div style="background: #f3f4f6; border-left: 3px solid #6366f1; padding: 12px 16px; margin: 0 0 16px; border-radius: 0 4px 4px 0;">
          <p style="color: #4b5563; margin: 0; font-style: italic;">"${message}"</p>
        </div>
      ` : ''}
      <p style="color: #4b5563; line-height: 1.6; margin: 0 0 16px;">
        Review their profile and approve or decline the request from your matches page.
      </p>
      ${actionButton('View Request', `${APP_URL}/matches`)}
    `);
    return sendEmail(to, subject, html);
  },

  async sendConnectionApprovedEmail(to: string, menteeName: string, mentorName: string): Promise<boolean> {
    const subject = `${mentorName} accepted your connection request!`;
    const html = wrapInTemplate(`
      <h2 style="color: #111827; margin: 0 0 16px;">Connection Approved!</h2>
      <p style="color: #4b5563; line-height: 1.6; margin: 0 0 16px;">
        Great news, ${menteeName}! <strong>${mentorName}</strong> has approved your connection request.
      </p>
      <p style="color: #4b5563; line-height: 1.6; margin: 0 0 16px;">
        You can now send them messages and start building your mentorship relationship.
      </p>
      ${actionButton('Start Messaging', `${APP_URL}/messages`)}
    `);
    return sendEmail(to, subject, html);
  },

  async sendNewMessageEmail(to: string, recipientName: string, senderName: string): Promise<boolean> {
    const subject = `New message from ${senderName}`;
    const html = wrapInTemplate(`
      <h2 style="color: #111827; margin: 0 0 16px;">New Message</h2>
      <p style="color: #4b5563; line-height: 1.6; margin: 0 0 16px;">
        Hi ${recipientName}, <strong>${senderName}</strong> sent you a new message on ${APP_NAME}.
      </p>
      <p style="color: #4b5563; line-height: 1.6; margin: 0 0 16px;">
        Log in to read and reply to their message.
      </p>
      ${actionButton('Read Message', `${APP_URL}/messages`)}
    `);
    return sendEmail(to, subject, html);
  },

  async sendMeetingScheduledEmail(to: string, recipientName: string, schedulerName: string, meetingTitle: string, scheduledAt: string, format: string): Promise<boolean> {
    const formatLabel = format === 'phone_call' ? 'Phone Call' : format === 'in_person' ? 'In Person' : 'Video Call';
    const dateStr = new Date(scheduledAt).toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
    const subject = `Meeting scheduled: ${meetingTitle}`;
    const html = wrapInTemplate(`
      <h2 style="color: #111827; margin: 0 0 16px;">Meeting Scheduled</h2>
      <p style="color: #4b5563; line-height: 1.6; margin: 0 0 16px;">
        Hi ${recipientName}, <strong>${schedulerName}</strong> has scheduled a meeting with you.
      </p>
      <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; margin: 0 0 16px;">
        <p style="margin: 0 0 8px; color: #111827; font-weight: 600;">${meetingTitle}</p>
        <p style="margin: 0 0 4px; color: #4b5563; font-size: 14px;">Date: ${dateStr}</p>
        <p style="margin: 0; color: #4b5563; font-size: 14px;">Format: ${formatLabel}</p>
      </div>
      ${actionButton('View Meeting Details', `${APP_URL}/meetings`)}
    `);
    return sendEmail(to, subject, html);
  },

  async sendEnterpriseleadNotification(lead: {
    fullName: string;
    workEmail: string;
    organization: string;
    roleTitle?: string;
    estimatedUsers: string;
    notes?: string;
  }): Promise<boolean> {
    const recipientEmail = process.env.ENTERPRISE_LEADS_TO_EMAIL || 'mentorfy.app@gmail.com';
    const subject = `New Enterprise Lead: ${lead.organization}`;
    const html = wrapInTemplate(`
      <h2 style="color: #111827; margin: 0 0 16px;">New Enterprise Inquiry</h2>
      <p style="color: #4b5563; line-height: 1.6; margin: 0 0 16px;">
        A new enterprise lead has submitted a quote request.
      </p>
      <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; margin: 0 0 16px;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr><td style="padding: 6px 8px; color: #6b7280; font-size: 14px; white-space: nowrap; vertical-align: top;">Name</td><td style="padding: 6px 8px; color: #111827; font-weight: 600; font-size: 14px;">${lead.fullName}</td></tr>
          <tr><td style="padding: 6px 8px; color: #6b7280; font-size: 14px; white-space: nowrap; vertical-align: top;">Email</td><td style="padding: 6px 8px; color: #111827; font-weight: 600; font-size: 14px;"><a href="mailto:${lead.workEmail}" style="color: #6366f1;">${lead.workEmail}</a></td></tr>
          <tr><td style="padding: 6px 8px; color: #6b7280; font-size: 14px; white-space: nowrap; vertical-align: top;">Organization</td><td style="padding: 6px 8px; color: #111827; font-weight: 600; font-size: 14px;">${lead.organization}</td></tr>
          ${lead.roleTitle ? `<tr><td style="padding: 6px 8px; color: #6b7280; font-size: 14px; white-space: nowrap; vertical-align: top;">Role/Title</td><td style="padding: 6px 8px; color: #111827; font-weight: 600; font-size: 14px;">${lead.roleTitle}</td></tr>` : ''}
          <tr><td style="padding: 6px 8px; color: #6b7280; font-size: 14px; white-space: nowrap; vertical-align: top;">Est. Users</td><td style="padding: 6px 8px; color: #111827; font-weight: 600; font-size: 14px;">${lead.estimatedUsers}</td></tr>
          ${lead.notes ? `<tr><td style="padding: 6px 8px; color: #6b7280; font-size: 14px; white-space: nowrap; vertical-align: top;">Notes</td><td style="padding: 6px 8px; color: #111827; font-size: 14px;">${lead.notes}</td></tr>` : ''}
        </table>
      </div>
      ${actionButton('Reply to Lead', `mailto:${lead.workEmail}?subject=Re: Mentorfy Enterprise Inquiry`)}
    `);
    return sendEmail(recipientEmail, subject, html);
  },

  async sendWorkEmailVerificationCode(to: string, firstName: string, code: string): Promise<boolean> {
    const subject = `Your ${APP_NAME} work email verification code`;
    const html = wrapInTemplate(`
      <h2 style="color: #111827; margin: 0 0 16px;">Verify Your Work Email</h2>
      <p style="color: #4b5563; line-height: 1.6; margin: 0 0 16px;">
        Hi ${firstName}, please use the verification code below to confirm your work email on ${APP_NAME}.
      </p>
      <div style="text-align: center; margin: 24px 0; padding: 20px; background: #f9fafb; border-radius: 8px;">
        <span style="font-size: 32px; font-weight: 700; letter-spacing: 6px; color: #111827;">${code}</span>
      </div>
      <p style="color: #4b5563; line-height: 1.6; margin: 0 0 16px;">
        This code expires in 15 minutes. If you didn't request this, you can safely ignore this email.
      </p>
    `);
    return sendEmail(to, subject, html);
  },

  async sendBadgeAwardedEmail(to: string, firstName: string, badgeNames: string[]): Promise<boolean> {
    const badgeList = badgeNames.map(name => {
      const colors: Record<string, { bg: string; text: string; label: string }> = {
        'FOUNDING_MENTOR': { bg: '#fef3c7', text: '#92400e', label: 'Founding Mentor' },
        'VERIFIED_MENTOR': { bg: '#dbeafe', text: '#1e40af', label: 'Verified Mentor' },
        'EARLY_SUPPORTER': { bg: '#f1f5f9', text: '#334155', label: 'Early Supporter' },
      };
      const style = colors[name] || { bg: '#f3f4f6', text: '#374151', label: name };
      return `<span style="display: inline-block; background: ${style.bg}; color: ${style.text}; padding: 4px 12px; border-radius: 9999px; font-size: 14px; font-weight: 600; margin: 4px;">${style.label}</span>`;
    }).join(' ');

    const subject = `You've earned ${badgeNames.length > 1 ? 'new badges' : 'a new badge'} on ${APP_NAME}!`;
    const html = wrapInTemplate(`
      <h2 style="color: #111827; margin: 0 0 16px;">Congratulations, ${firstName}!</h2>
      <p style="color: #4b5563; line-height: 1.6; margin: 0 0 16px;">
        You've been awarded ${badgeNames.length > 1 ? 'special badges' : 'a special badge'} on ${APP_NAME} in recognition of your early support and commitment to mentorship.
      </p>
      <div style="text-align: center; margin: 24px 0; padding: 20px; background: #f9fafb; border-radius: 8px;">
        ${badgeList}
      </div>
      <p style="color: #4b5563; line-height: 1.6; margin: 0 0 16px;">
        These badges are now visible on your profile, helping students recognize you as a trusted and valued mentor on the platform.
      </p>
      ${actionButton('View Your Profile', `${APP_URL}/profile`)}
    `);
    return sendEmail(to, subject, html);
  },

  async sendPasswordResetEmail(to: string, firstName: string, resetUrl: string): Promise<boolean> {
    const subject = `Reset your ${APP_NAME} password`;
    const html = wrapInTemplate(`
      <h2 style="color: #111827; margin: 0 0 16px;">Password Reset Request</h2>
      <p style="color: #4b5563; line-height: 1.6; margin: 0 0 16px;">
        Hi ${firstName}, we received a request to reset your password on ${APP_NAME}.
      </p>
      <p style="color: #4b5563; line-height: 1.6; margin: 0 0 16px;">
        Click the button below to set a new password. This link expires in 1 hour.
      </p>
      ${actionButton('Reset Password', resetUrl)}
      <p style="color: #9ca3af; font-size: 13px; line-height: 1.6; margin: 16px 0 0;">
        If you didn't request this, you can safely ignore this email. Your password will remain unchanged.
      </p>
    `);
    return sendEmail(to, subject, html);
  },

  async sendEmailVerificationEmail(to: string, firstName: string, verifyUrl: string): Promise<boolean> {
    const subject = `Verify your ${APP_NAME} email address`;
    const html = wrapInTemplate(`
      <h2 style="color: #111827; margin: 0 0 16px;">Verify Your Email</h2>
      <p style="color: #4b5563; line-height: 1.6; margin: 0 0 16px;">
        Hi ${firstName}, thanks for signing up for ${APP_NAME}! Please verify your email address to unlock all features.
      </p>
      ${actionButton('Verify Email', verifyUrl)}
      <p style="color: #9ca3af; font-size: 13px; line-height: 1.6; margin: 16px 0 0;">
        This link expires in 24 hours. If you didn't create an account, you can safely ignore this email.
      </p>
    `);
    return sendEmail(to, subject, html);
  },

  async sendReviewReceivedEmail(to: string, mentorName: string, reviewerName: string, rating: number): Promise<boolean> {
    const subject = `${reviewerName} left you a review`;
    const html = wrapInTemplate(`
      <h2 style="color: #111827; margin: 0 0 16px;">New Review Received</h2>
      <p style="color: #4b5563; line-height: 1.6; margin: 0 0 16px;">
        Hi ${mentorName}, <strong>${reviewerName}</strong> left you a ${rating}-star review on ${APP_NAME}.
      </p>
      <div style="text-align: center; margin: 16px 0;">
        <span style="font-size: 24px; font-weight: 700; color: #f59e0b;">${rating} / 5</span>
      </div>
      <p style="color: #4b5563; line-height: 1.6; margin: 0 0 16px;">
        Check your analytics dashboard to see all your reviews and ratings.
      </p>
      ${actionButton('View Your Reviews', `${APP_URL}/analytics`)}
    `);
    return sendEmail(to, subject, html);
  },
};
