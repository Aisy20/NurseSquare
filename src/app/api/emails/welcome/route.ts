import { NextRequest, NextResponse } from 'next/server'
import { sendEmail, emailTemplates } from '@/lib/resend'

export async function POST(req: NextRequest) {
  const { email, role, name } = await req.json()

  if (!email || !role || !name) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json({ ok: true, skipped: 'no_api_key' })
  }

  try {
    if (role === 'nurse') {
      await sendEmail({
        to: email,
        subject: 'Welcome to NurseSquare',
        html: emailTemplates.welcomeNurse(name),
      })
    } else if (role === 'hospital') {
      await sendEmail({
        to: email,
        subject: 'Welcome to NurseSquare',
        html: emailTemplates.welcomeEmployer(name),
      })
    }
    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'send failed' }, { status: 500 })
  }
}
