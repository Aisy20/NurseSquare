/**
 * Seed test login accounts for manual / QA testing.
 *
 * Creates one account per role (nurse, hospital, admin) with known passwords,
 * pre-confirmed emails (no inbox needed), and a populated role profile.
 *
 * Usage:
 *   npm run seed:test            # create / upsert the test accounts
 *   npm run seed:test -- --clean # delete the test accounts (and cascade profiles)
 *
 * Requires SUPABASE_SERVICE_ROLE_KEY + NEXT_PUBLIC_SUPABASE_URL in .env.local.
 */
import { createServiceClient } from '../src/lib/supabase/service'

type Role = 'nurse' | 'hospital' | 'admin'

interface TestAccount {
  email: string
  password: string
  role: Role
  /** Extra rows to insert after the auth user + public.users row exist. */
  profile?: (userId: string) => { table: string; row: Record<string, unknown> }
}

// These match the "demo accounts" advertised on /auth/login so the auto-fill
// buttons actually sign in. Keep emails/passwords in sync with that page.
const ACCOUNTS: TestAccount[] = [
  {
    email: 'nurse@test.com',
    password: 'Test123',
    role: 'nurse',
    profile: (userId) => ({
      table: 'nurse_profiles',
      row: {
        user_id: userId,
        full_name: 'Tessa Test (RN)',
        license_type: 'RN',
        license_number: 'TEST123456',
        license_state: 'CA',
        specialty: 'ICU',
        years_exp: 5,
        bio: 'Seeded test nurse account for QA.',
        hourly_rate: 65,
        weekly_rate: 2600,
        availability: 'available',
        city: 'Los Angeles',
        state: 'CA',
        zip: '90001',
        license_verified: true,
        background_check_status: 'passed',
      },
    }),
  },
  {
    email: 'employer@test.com',
    password: 'Test456',
    role: 'hospital',
    profile: (userId) => ({
      table: 'employer_profiles',
      row: {
        user_id: userId,
        org_name: 'Test General Hospital',
        type: 'hospital',
        contact_name: 'Hank Hospital',
        phone: '555-010-0100',
        address: '1 Test Plaza',
        city: 'Los Angeles',
        state: 'CA',
        zip: '90001',
        verified: true,
        subscription_tier: 'pro',
      },
    }),
  },
  {
    email: 'admin@test.com',
    password: 'Test789',
    role: 'admin',
  },
]

const supabase = createServiceClient()

/** Find an existing auth user by email (paginates the admin list). */
async function findUserByEmail(email: string): Promise<string | null> {
  for (let page = 1; page <= 50; page++) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 1000 })
    if (error) throw error
    const match = data.users.find((u) => u.email?.toLowerCase() === email.toLowerCase())
    if (match) return match.id
    if (data.users.length < 1000) break
  }
  return null
}

async function clean() {
  for (const acct of ACCOUNTS) {
    const id = await findUserByEmail(acct.email)
    if (!id) {
      console.log(`- ${acct.email}: not found, skipping`)
      continue
    }
    const { error } = await supabase.auth.admin.deleteUser(id)
    if (error) throw error
    console.log(`✗ deleted ${acct.email}`)
  }
}

async function seed() {
  for (const acct of ACCOUNTS) {
    let userId = await findUserByEmail(acct.email)

    if (userId) {
      // Reset password + confirm so the documented creds always work.
      const { error } = await supabase.auth.admin.updateUserById(userId, {
        password: acct.password,
        email_confirm: true,
        user_metadata: { role: acct.role },
      })
      if (error) throw error
      console.log(`↻ updated ${acct.email} (${acct.role})`)
    } else {
      const { data, error } = await supabase.auth.admin.createUser({
        email: acct.email,
        password: acct.password,
        email_confirm: true,
        user_metadata: { role: acct.role },
      })
      if (error) throw error
      userId = data.user.id
      console.log(`✓ created ${acct.email} (${acct.role})`)
    }

    // The on_auth_user_created trigger creates public.users from user_metadata.role.
    // Upsert the role profile (idempotent on user_id).
    if (acct.profile) {
      const { table, row } = acct.profile(userId)
      const { error } = await supabase.from(table).upsert(row, { onConflict: 'user_id' })
      if (error) throw error
      console.log(`  └─ ${table} ready`)
    }
  }

  // Seed one active job posting so the public board (/nurse/jobs) has content.
  const { data: emp } = await supabase
    .from('employer_profiles')
    .select('id')
    .eq('org_name', 'Test General Hospital')
    .maybeSingle()
  if (emp) {
    const sampleTitle = 'ICU Travel Nurse — 13-Week Contract'
    const { data: existing } = await supabase
      .from('job_postings')
      .select('id')
      .eq('employer_id', emp.id)
      .eq('title', sampleTitle)
      .maybeSingle()
    if (!existing) {
      const { error } = await supabase.from('job_postings').insert({
        employer_id: emp.id,
        title: sampleTitle,
        location: 'Chicago, IL',
        city: 'Chicago',
        state: 'IL',
        start_date: '2026-09-01',
        duration_weeks: 13,
        weekly_rate: 3500,
        specialty_required: 'ICU',
        description: 'Seeded sample posting for the public job board.',
        requirements: 'Minimum 2 years ICU experience. BLS/ACLS required.',
        status: 'active',
      })
      if (error) throw error
      console.log('✓ created sample job posting')
    } else {
      console.log('↻ sample job posting already exists')
    }
  }

  console.log('\nTest credentials (login at /auth/login):')
  for (const acct of ACCOUNTS) {
    console.log(`  ${acct.role.padEnd(8)} ${acct.email}  ${acct.password}`)
  }
}

async function main() {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY || !process.env.NEXT_PUBLIC_SUPABASE_URL) {
    console.error('Missing SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_URL in .env.local')
    process.exit(1)
  }
  if (process.argv.includes('--clean')) {
    await clean()
  } else {
    await seed()
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
