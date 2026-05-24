import type { Metadata } from 'next'
import LegalLayout from '@/components/legal/LegalLayout'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Terms of Service · NurseSquare' }

export default function TermsPage() {
  return (
    <LegalLayout
      eyebrow="Legal"
      title="Terms of Service"
      intro="The agreement between you and NurseSquare when you use the platform to find work, hire nurses, or manage placements."
      lastUpdated="May 24, 2026"
      sections={[
        {
          heading: 'Acceptance of terms',
          body: (
            <p>
              By creating an account or using NurseSquare, you agree to these Terms. If you are using
              the platform on behalf of an organization, you represent that you have authority to bind
              that organization.
            </p>
          ),
        },
        {
          heading: 'Eligibility & accounts',
          body: (
            <p>
              Nurses must hold a valid, current license in the state(s) where they intend to work and
              must complete identity, license, and background verification before applying to jobs.
              You are responsible for keeping your account credentials secure and your profile
              accurate.
            </p>
          ),
        },
        {
          heading: 'Placement fees & payments',
          body: (
            <p>
              NurseSquare charges employers a 15% placement fee on the total contract value. Nurses
              pay nothing. Payments are processed and held in escrow through Stripe and released
              according to the placement terms. Cancellation fees are tiered by how far in advance a
              cancellation occurs, as shown on each job listing.
            </p>
          ),
        },
        {
          heading: 'Acceptable use',
          body: (
            <p>
              You agree not to misrepresent credentials, post fraudulent jobs, circumvent platform
              fees, harass other users, or attempt to disrupt the service. We may suspend or terminate
              accounts that violate these Terms.
            </p>
          ),
        },
        {
          heading: 'Disclaimers & limitation of liability',
          body: (
            <p>
              NurseSquare is a marketplace connecting nurses and employers; we are not the employer of
              any nurse and do not guarantee placements or outcomes. The service is provided
              &quot;as is&quot; to the fullest extent permitted by law.
            </p>
          ),
        },
        {
          heading: 'Changes to these terms',
          body: (
            <p>
              We may update these Terms from time to time. Material changes will be communicated via
              email or in-app notice. Continued use after changes take effect constitutes acceptance.
            </p>
          ),
        },
      ]}
    />
  )
}
