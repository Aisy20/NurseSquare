'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Menu, X, ChevronDown, BriefcaseBusiness, Building2, Info, Mail } from 'lucide-react'
import Button from '@/components/ui/Button'

interface NavbarProps {
  userRole?: 'nurse' | 'hospital' | 'admin' | null
  userName?: string | null
}

function LogoMark({ size = 34, square, dot }: { size?: number; square: string; dot: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 44 44" fill="none">
      <rect width="44" height="44" rx="10" fill={square}/>
      <rect x="8" y="9" width="8" height="26" rx="4" fill="white"/>
      <rect x="28" y="9" width="8" height="26" rx="4" fill="white"/>
      <path d="M11 32 L33 12" stroke="white" strokeWidth="8" strokeLinecap="round"/>
      <circle cx="36" cy="10" r="5" fill={dot}/>
    </svg>
  )
}

export function Logo({ inv = false, variant = 'nurse' }: { inv?: boolean; variant?: 'nurse' | 'hospital' }) {
  // Mark and text colors per (variant, inv) — pair is always mark + opposite-color dot.
  let mark = { square: '#2D1B69', dot: '#FF7940' } // nurse default: plum + tang dot
  let textMain = 'var(--ink)'
  let textAccent = 'var(--plum)'

  if (variant === 'hospital' && !inv) {
    mark = { square: '#FF7940', dot: '#2D1B69' } // tang + plum dot
    textAccent = 'var(--tang-mid)'
  } else if (variant === 'hospital' && inv) {
    // Sidebar bg is bright tang — need dark mark so it shows
    mark = { square: '#1C1044', dot: '#FF7940' } // plum-deep + tang dot
    textMain = 'var(--plum-deep)'
    textAccent = 'var(--plum-deep)'
  } else if (variant === 'nurse' && inv) {
    // Sidebar bg is plum-deep — default mark already contrasts fine
    textMain = 'white'
    textAccent = 'var(--tang)'
  }

  return (
    <Link href="/" className="flex items-center gap-2.5 no-underline">
      <LogoMark square={mark.square} dot={mark.dot} />
      <span className="text-[17px] font-bold"
        style={{ color: textMain, fontFamily: 'var(--font-sora)' }}>
        Nurse<span style={{ color: textAccent }}>Square</span>
      </span>
    </Link>
  )
}

export default function Navbar({ userRole, userName }: NavbarProps) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  const nurseLinks = [
    { href: '/nurse/jobs', label: 'Find Jobs' },
    { href: '/nurse/applications', label: 'My Applications' },
    { href: '/nurse/ledger', label: 'Pay Ledger' },
    { href: '/nurse/credentials', label: 'Credentials' },
    { href: '/nurse/tax-home', label: 'Tax Home' },
    { href: '/messages', label: 'Messages' },
    { href: '/nurse/payments', label: 'Payments' },
    { href: '/nurse/dashboard', label: 'Dashboard' },
  ]

  const hospitalLinks = [
    { href: '/hospital/nurses', label: 'Browse Nurses' },
    { href: '/hospital/post-job', label: 'Post a Job' },
    { href: '/hospital/applicants', label: 'Applicants' },
    { href: '/messages', label: 'Messages' },
    { href: '/hospital/billing', label: 'Billing' },
    { href: '/hospital/dashboard', label: 'Dashboard' },
  ]

  const adminLinks = [
    { href: '/admin', label: 'Overview' },
    { href: '/admin/users', label: 'Users' },
    { href: '/admin/jobs', label: 'Jobs' },
    { href: '/admin/payments', label: 'Payments' },
    { href: '/admin/ledger', label: 'Ledger Review' },
  ]

  const links = userRole === 'nurse' ? nurseLinks : userRole === 'hospital' ? hospitalLinks : userRole === 'admin' ? adminLinks : []
  const navBackground =
    userRole === 'nurse'
      ? 'rgba(246,241,255,0.94)'
      : userRole === 'hospital'
        ? 'rgba(242,250,245,0.94)'
        : 'rgba(250,250,247,0.94)'

  const publicLinks = [
    { href: '/jobs', label: 'Jobs', icon: BriefcaseBusiness },
    { href: '/auth/register/hospital', label: 'Hospitals', icon: Building2 },
    { href: '/about', label: 'About', icon: Info },
    { href: '/contact', label: 'Contact', icon: Mail },
  ]

  return (
    <nav className="sticky top-0 z-50 flex h-[64px] items-center border-b px-4 sm:px-8 lg:px-12"
      style={{ background: navBackground, backdropFilter: 'blur(18px)', WebkitBackdropFilter: 'blur(18px)', borderColor: 'rgba(17,16,24,0.08)' }}>
      <div className="mx-auto flex w-full max-w-[1280px] items-center justify-between">
        <div className="flex items-center gap-8">
          <Logo />
          {!userRole && (
            <ul className="m-0 hidden list-none gap-1 p-0 md:flex">
              {publicLinks.map(link => (
                <li key={link.href}>
                  <Link href={link.href} className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-[13px] font-medium no-underline transition-colors hover:bg-[var(--cream-mid)] hover:text-[var(--ink)]" style={{ color: 'var(--g600)' }}>
                    <link.icon className="h-3.5 w-3.5" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          )}
          {links.length > 0 && (
            <ul className="hidden md:flex gap-1 list-none m-0 p-0">
              {links.map(link => (
                <li key={link.href}>
                  <Link href={link.href} className="px-3 py-2 rounded-lg text-[13px] font-medium no-underline transition-colors hover:text-[var(--ink)]"
                    style={{ color: 'var(--g600)' }}>{link.label}</Link>
                </li>
              ))}
              <li>
                <Link href="/about" className="px-3 py-2 rounded-lg text-[13px] font-medium no-underline transition-colors hover:text-[var(--ink)]"
                  style={{ color: 'var(--g600)' }}>About</Link>
              </li>
            </ul>
          )}
        </div>

        <div className="flex items-center gap-2">
          {userRole ? (
            <div className="relative">
              <button onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="focus-ring flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-medium transition-colors hover:bg-[var(--cream-mid)]"
                style={{ color: 'var(--ink)' }}>
                <div className="flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold"
                  style={{ background: 'var(--plum-50)', color: 'var(--plum)' }}>
                  {userName?.charAt(0).toUpperCase() || 'U'}
                </div>
                <span className="hidden sm:block">{userName}</span>
                <ChevronDown className="w-4 h-4" />
              </button>
              {userMenuOpen && (
                <div className="absolute right-0 z-50 mt-2 w-48 rounded-lg border py-1.5 shadow-[var(--shadow-md)]"
                  style={{ background: 'var(--surface)', borderColor: 'var(--g100)' }}>
                  <Link href={userRole === 'nurse' ? '/nurse/profile' : '/hospital/profile'}
                    className="block px-4 py-2 text-sm no-underline transition-colors hover:bg-[var(--cream-mid)]"
                    style={{ color: 'var(--ink)' }}
                    onClick={() => setUserMenuOpen(false)}>My Profile</Link>
                  <hr style={{ borderColor: 'var(--g100)' }} className="my-1" />
                  <button onClick={handleSignOut}
                    className="w-full text-left px-4 py-2 text-sm transition-colors hover:bg-[var(--tang-50)]"
                    style={{ color: 'var(--tang)' }}>Sign out</button>
                </div>
              )}
            </div>
          ) : (
            <div className="hidden sm:flex items-center gap-2">
              <Link href="/auth/login"><Button variant="ghost" size="sm">Log in</Button></Link>
              <Link href="/auth/register"><Button variant="primary" size="sm">Join NurseSquare</Button></Link>
            </div>
          )}
          <button className="focus-ring rounded-lg p-2 md:hidden" style={{ color: 'var(--ink)' }}
            onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="absolute left-0 right-0 top-[64px] space-y-1 border-t px-4 py-3 shadow-[var(--shadow-md)]"
          style={{ background: 'var(--cream)', borderColor: 'var(--g100)' }}>
          {publicLinks.map(link => (
            <Link key={link.href} href={link.href} className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm no-underline" style={{ color: 'var(--g600)' }} onClick={() => setMobileOpen(false)}>
              <link.icon className="h-4 w-4" />
              {link.label}
            </Link>
          ))}
          {links.map(link => (
            <Link key={link.href} href={link.href} className="block px-3 py-2 rounded-lg text-sm no-underline" style={{ color: 'var(--g600)' }} onClick={() => setMobileOpen(false)}>{link.label}</Link>
          ))}
          {!userRole && (
            <div className="pt-2 flex gap-2">
              <Link href="/auth/login" className="flex-1"><Button variant="outline" size="sm" className="w-full">Log in</Button></Link>
              <Link href="/auth/register" className="flex-1"><Button variant="primary" size="sm" className="w-full">Join NurseSquare</Button></Link>
            </div>
          )}
        </div>
      )}
    </nav>
  )
}
