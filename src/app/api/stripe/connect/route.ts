import { NextRequest, NextResponse } from 'next/server'
import { stripe, calculatePlatformFee } from '@/lib/stripe'
import { createClient } from '@/lib/supabase/server'
import { sendEmail, emailTemplates } from '@/lib/resend'

export async function POST(req: NextRequest) {
  const { applicationId } = await req.json()

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: application } = await supabase
    .from('applications')
    .select('*, job_postings(*, employer_profiles(*)), nurse_profiles(*)')
    .eq('id', applicationId)
    .single()

  if (!application) return NextResponse.json({ error: 'Application not found' }, { status: 404 })

  const job = application.job_postings
  const contractValue = job.weekly_rate * job.duration_weeks
  const platformFee = calculatePlatformFee(contractValue)

  try {
    let customerId = application.job_postings.employer_profiles.stripe_customer_id

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: application.job_postings.employer_profiles.org_name,
        metadata: { employer_profile_id: application.job_postings.employer_profiles.id },
      })
      customerId = customer.id

      await supabase
        .from('employer_profiles')
        .update({ stripe_customer_id: customerId })
        .eq('id', application.job_postings.employer_profiles.id)
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(contractValue * 100),
      currency: 'usd',
      customer: customerId,
      description: `NurseSquare placement: ${job.title}`,
      metadata: {
        application_id: applicationId,
        job_id: job.id,
        nurse_id: application.nurse_id,
        employer_id: job.employer_id,
        platform_fee: platformFee.toString(),
      },
    })

    const { data: placement } = await supabase.from('placements').insert({
      job_id: job.id,
      nurse_id: application.nurse_id,
      employer_id: job.employer_id,
      contract_value: contractValue,
      platform_fee: platformFee,
      escrow_status: 'held',
      stripe_payment_intent_id: paymentIntent.id,
      start_date: job.start_date,
    }).select().single()

    await supabase
      .from('applications')
      .update({ status: 'accepted' })
      .eq('id', applicationId)

    await supabase
      .from('job_postings')
      .update({ status: 'filled' })
      .eq('id', job.id)

    const { data: nurseUser } = await supabase
      .from('users')
      .select('email')
      .eq('id', application.nurse_profiles.user_id)
      .single()

    if (nurseUser?.email && process.env.RESEND_API_KEY) {
      sendEmail({
        to: nurseUser.email,
        subject: `Placement confirmed: ${job.title}`,
        html: emailTemplates.placementConfirmed(job.title, job.start_date),
      }).catch(() => {})
    }

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      placementId: placement?.id,
      contractValue,
      platformFee,
    })
  } catch (err: any) {
    console.error('Stripe connect error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
