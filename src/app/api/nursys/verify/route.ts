import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const { licenseNumber, licenseState, nurseProfileId } = await req.json()

  if (!licenseNumber || !licenseState || !nurseProfileId) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const nursysApiKey = process.env.NURSYS_API_KEY
  const nursysBaseUrl = process.env.NURSYS_BASE_URL || 'https://api.nursys.com'

  try {
    let verified = false

    if (nursysApiKey) {
      const response = await fetch(`${nursysBaseUrl}/v1/licenses/verify`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${nursysApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          licenseNumber,
          licenseState,
          licenseType: 'RN',
        }),
      })

      if (response.ok) {
        const data = await response.json()
        verified = data.status === 'active' || data.status === 'valid'
      }
    } else {
      // Dev/demo mode: accept any plausible license format
      verified = licenseNumber.length >= 5 && licenseState.length === 2
    }

    if (verified) {
      const supabase = await createClient()
      await supabase
        .from('nurse_profiles')
        .update({ license_verified: true })
        .eq('id', nurseProfileId)
    }

    return NextResponse.json({ verified })
  } catch (err) {
    console.error('Nursys verify error:', err)
    return NextResponse.json({ error: 'Verification service unavailable' }, { status: 500 })
  }
}
