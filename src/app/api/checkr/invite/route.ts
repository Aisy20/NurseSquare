import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const { nurseProfileId, email } = await req.json()

  if (!nurseProfileId || !email) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const checkrApiKey = process.env.CHECKR_API_KEY

  try {
    let invitationUrl: string
    let candidateId: string

    if (checkrApiKey) {
      const candidateRes = await fetch('https://api.checkr.com/v1/candidates', {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${Buffer.from(checkrApiKey + ':').toString('base64')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      })

      if (!candidateRes.ok) {
        const err = await candidateRes.json()
        return NextResponse.json({ error: err.message || 'Failed to create Checkr candidate' }, { status: 500 })
      }

      const candidate = await candidateRes.json()
      candidateId = candidate.id

      const inviteRes = await fetch('https://api.checkr.com/v1/invitations', {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${Buffer.from(checkrApiKey + ':').toString('base64')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          candidate_id: candidateId,
          package: process.env.CHECKR_PACKAGE_SLUG || 'tasker_standard',
        }),
      })

      if (!inviteRes.ok) {
        const err = await inviteRes.json()
        return NextResponse.json({ error: err.message || 'Failed to create Checkr invitation' }, { status: 500 })
      }

      const invitation = await inviteRes.json()
      invitationUrl = invitation.invitation_url
      candidateId = candidate.id
    } else {
      // Dev mode
      invitationUrl = `https://apply.checkr.com/apply/demo?email=${encodeURIComponent(email)}`
      candidateId = 'demo-candidate-id'
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
