import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const { nurseProfileId, email } = await req.json()

  if (!nurseProfileId || !email) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const checkrApiKey = process.env.CHECKR_API_KEY
  const checkrPackage = process.env.CHECKR_PACKAGE_SLUG

  // Marketing copy promises the worker pays the Checkr fee directly. Whether
  // the candidate or the employer is billed is determined by the package slug
  // — there's no universal "candidate-paid" default. Refuse to invite if no
  // slug is configured, rather than silently falling back to an employer-paid
  // package and surprising the platform with a bill.
  if (checkrApiKey && !checkrPackage) {
    return NextResponse.json({
      error: 'CHECKR_PACKAGE_SLUG not configured. Set the candidate-paid package slug in env before inviting candidates.',
    }, { status: 500 })
  }

  try {
    let invitationUrl: string
    let candidateId: string

    if (checkrApiKey) {
      const authHeader = `Basic ${Buffer.from(checkrApiKey + ':').toString('base64')}`

      const candidateRes = await fetch('https://api.checkr.com/v1/candidates', {
        method: 'POST',
        headers: { 'Authorization': authHeader, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          no_middle_name: true,
          custom_id: nurseProfileId,
        }),
      })

      if (!candidateRes.ok) {
        const err = await candidateRes.json().catch(() => ({}))
        return NextResponse.json({ error: err.error || err.message || 'Failed to create Checkr candidate' }, { status: 500 })
      }

      const candidate = await candidateRes.json()
      candidateId = candidate.id

      const inviteRes = await fetch('https://api.checkr.com/v1/invitations', {
        method: 'POST',
        headers: { 'Authorization': authHeader, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          candidate_id: candidateId,
          package: checkrPackage,
        }),
      })

      if (!inviteRes.ok) {
        const err = await inviteRes.json().catch(() => ({}))
        return NextResponse.json({ error: err.error || err.message || 'Failed to create Checkr invitation' }, { status: 500 })
      }

      const invitation = await inviteRes.json()
      invitationUrl = invitation.invitation_url
    } else {
      invitationUrl = `https://apply.checkr.com/apply/demo?email=${encodeURIComponent(email)}`
      candidateId = `demo-${nurseProfileId}`
    }

    const supabase = await createClient()
    await supabase
      .from('nurse_profiles')
      .update({
        background_check_status: 'in_progress',
        checkr_candidate_id: candidateId,
      })
      .eq('id', nurseProfileId)

    return NextResponse.json({ invitationUrl, candidateId })
  } catch (err) {
    console.error('Checkr invite error:', err)
    return NextResponse.json({ error: 'Background check service unavailable' }, { status: 500 })
  }
}
