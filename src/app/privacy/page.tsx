import type { Metadata } from 'next'
import LegalLayout from '@/components/legal/LegalLayout'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Privacy Policy · NurseSquare' }

export default function PrivacyPage() {
  return (
    <LegalLayout
      eyebrow="Legal"
      title="Privacy Policy"
      intro="How NurseSquare collects, uses, and protects the information you share when you browse jobs, build a profile, or hire nurses."
      lastUpdated="May 24, 2026"
      sections={[
        {
          heading: 'Information we collect',
          body: (
            <>
              <p>
                We collect the information you provide directly — account details (name, email,
                role), nurse credentials (license type, number, and state), employer organization
                details, job postings, applications, and messages exchanged on the platform.
              </p>
              <p>
                We also collect limited technical data such as IP address, device and browser type,
                and usage events needed to operate and secure the service.
              </p>
            </>
          ),
        },
        {
          heading: 'How we use information',
          body: (
            <p>
              We use your information to verify nursing licenses (via Nursys/NCSBN), run background
              checks (via Checkr), process payments and escrow (via Stripe), send transactional
              email (via Resend), match nurses with jobs, and keep the platform safe. We do not sell
              your personal information.
            </p>
          ),
        },
        {
          heading: 'Sharing with third parties',
          body: (
            <p>
              We share data only with the service providers needed to deliver NurseSquare (license
              verification, background checks, payments, and email) and where required by law. Each
              provider receives only the data necessary for its function.
            </p>
          ),
        },
        {
          heading: 'Data retention & security',
          body: (
            <p>
              We retain your data for as long as your account is active or as needed to meet legal
              and regulatory obligations. Access is restricted by row-level security, and sensitive
              identifiers (such as the last four digits of an SSN used for license verification) are
              limited to the minimum required.
            </p>
          ),
        },
        {
          heading: 'Your rights',
          body: (
            <p>
              You may access, correct, or delete your account information at any time from your
              profile, or by contacting us. Deleting your account removes your profile and associated
              records, subject to retention required by law.
            </p>
          ),
        },
      ]}
    />
  )
}
