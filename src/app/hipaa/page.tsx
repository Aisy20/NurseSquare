import type { Metadata } from 'next'
import LegalLayout from '@/components/legal/LegalLayout'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'HIPAA & Data Handling · NurseSquare' }

export default function HipaaPage() {
  return (
    <LegalLayout
      eyebrow="Compliance"
      title="HIPAA & Data Handling"
      intro="How NurseSquare approaches protected health information and the safeguards around the sensitive data we do handle."
      lastUpdated="May 24, 2026"
      sections={[
        {
          heading: 'Our role',
          body: (
            <p>
              NurseSquare is a hiring and credentialing marketplace. We are not a healthcare provider
              and do not create, receive, or store patient Protected Health Information (PHI) in the
              course of providing the platform. Nurses and employers must never upload patient PHI to
              NurseSquare.
            </p>
          ),
        },
        {
          heading: 'Sensitive personal data we handle',
          body: (
            <p>
              We process sensitive identifiers strictly for verification: nursing license details,
              the last four digits of an SSN and birth year (for Nursys/NCSBN matching), and
              background-check results (via Checkr). This information is used only to confirm
              eligibility to work and is never used for any other purpose.
            </p>
          ),
        },
        {
          heading: 'Safeguards',
          body: (
            <p>
              Data is encrypted in transit and at rest, access is restricted through row-level
              security and least-privilege controls, and sensitive fields are limited to the minimum
              necessary. Third-party processors are bound by their own security and compliance
              commitments.
            </p>
          ),
        },
        {
          heading: 'Reporting a concern',
          body: (
            <p>
              If you believe PHI has been shared on the platform in error, or you have a data-handling
              concern, contact us immediately at{' '}
              <a href="mailto:hello@nursesquare.com" className="font-semibold no-underline text-[var(--plum)]">
                hello@nursesquare.com
              </a>{' '}
              so we can investigate and remediate.
            </p>
          ),
        },
      ]}
    />
  )
}
