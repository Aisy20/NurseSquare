import { Resend } from 'resend'

export const resend = new Resend(process.env.RESEND_API_KEY!)

export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string
  subject: string
  html: string
}) {
  return resend.emails.send({
    from: 'NurseSquare <noreply@nursesquare.com>',
    to,
    subject,
    html,
  })
}

export const emailTemplates = {
  applicationReceived: (nurseName: string, jobTitle: string) => `
    <h2>New Application Received</h2>
    <p>${nurseName} has applied for <strong>${jobTitle}</strong>.</p>
    <p>Log in to your dashboard to review their profile and application.</p>
    <a href="${process.env.NEXT_PUBLIC_APP_URL}/hospital/applicants" style="background:#2563eb;color:white;padding:12px 24px;border-radius:6px;text-decoration:none;">View Application</a>
  `,

  applicationStatusUpdate: (jobTitle: string, status: string) => `
    <h2>Application Update</h2>
    <p>Your application for <strong>${jobTitle}</strong> has been updated to: <strong>${status}</strong>.</p>
    <a href="${process.env.NEXT_PUBLIC_APP_URL}/nurse/applications" style="background:#2563eb;color:white;padding:12px 24px;border-radius:6px;text-decoration:none;">View Dashboard</a>
  `,

  placementConfirmed: (jobTitle: string, startDate: string) => `
    <h2>Placement Confirmed!</h2>
    <p>Your placement for <strong>${jobTitle}</strong> starting <strong>${startDate}</strong> has been confirmed.</p>
    <p>Payment is held in escrow and will be released 48 hours after your start date.</p>
    <a href="${process.env.NEXT_PUBLIC_APP_URL}/nurse/dashboard" style="background:#2563eb;color:white;padding:12px 24px;border-radius:6px;text-decoration:none;">View Dashboard</a>
  `,

  welcomeNurse: (name: string) => `
    <h2>Welcome to NurseSquare, ${name}!</h2>
    <p>Your account is ready. Complete your profile to start applying for travel nurse positions.</p>
    <p><strong>Next steps:</strong></p>
    <ol>
      <li>Complete your profile</li>
      <li>Add your nursing license</li>
      <li>Run your background check</li>
      <li>Browse available jobs</li>
    </ol>
    <a href="${process.env.NEXT_PUBLIC_APP_URL}/nurse/profile" style="background:#2563eb;color:white;padding:12px 24px;border-radius:6px;text-decoration:none;">Complete Profile</a>
  `,

  welcomeEmployer: (orgName: string) => `
    <h2>Welcome to NurseSquare, ${orgName}!</h2>
    <p>Your employer account is ready. Post jobs and connect directly with qualified travel nurses — no middleman agencies.</p>
    <a href="${process.env.NEXT_PUBLIC_APP_URL}/hospital/post-job" style="background:#2563eb;color:white;padding:12px 24px;border-radius:6px;text-decoration:none;">Post Your First Job</a>
  `,
}
