'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Menu, X, ChevronDown } from 'lucide-react'
import Button from '@/components/ui/Button'

interface NavbarProps {
  userRole?: 'nurse' | 'hospital' | 'admin' | null
  userName?: string | null
}

function LogoMark({ size = 34, square, dot }: { size?: number; square: string; dot: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 44 44" fill="none">
      <rect width="44" height="44" rx="12" fill={square}/>
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
      <span className="text-[17px] font-bold tracking-tight"
        style={{ color: textMain, fontFamily: 'var(--font-sora)', letterSpacing: '-0.4px' }}>
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
    { href: '/nurse/dashboard', label: 'Dashboard' },
  ]

  const hospitalLinks = [
    { href: '/hospital/nurses', label: 'Browse Nurses' },
    { href: '/hospital/post-job', label: 'Post a Job' },
    { href: '/hospital/applicants', label: 'Applicants' },
    { href: '/hospital/dashboard', label: 'Dashboard' },
  ]

  const links = userRole === 'nurse' ? nurseLinks : userRole === 'hospital' ? hospitalLinks : []

  return (
    <nav className="sticky top-0 z-50 h-[68px] flex items-center px-4 sm:px-8 lg:px-12"
      style={{ background: 'rgba(250,250,247,0.94)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
      <div className="max-w-[1280px] mx-auto w-full flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Logo />
          {!userRole && (
            <ul className="hidden md:flex gap-8 list-none m-0 p-0">
              <li><Link href="/nurse/jobs" className="text-[13px] font-medium no-underline transition-colors hover:text-[var(--ink)]" style={{ color: 'var(--g600)' }}>Browse Jobs</Link></li>
              <li><Link href="/auth/register/hospital" className="text-[13px] font-medium no-underline transition-colors hover:text-[var(--ink)]" style={{ color: 'var(--g600)' }}>For Hospitals</Link></li>
              <li><Link href="/about" className="text-[13px] font-medium no-underline transition-colors hover:text-[var(--ink)]" style={{ color: 'var(--g600)' }}>About</Link></li>
              <li><Link href="/contact" className="text-[13px] font-medium no-underline transition-colors hover:text-[var(--ink)]" style={{ color: 'var(--g600)' }}>Contact</Link></li>
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
            </ul>
          )}
        </div>

        <div className="flex items-center gap-2">
          {userRole ? (
            <div className="relative">
              <button onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 text-sm font-medium px-3 py-2 rounded-xl transition-colors"
                style={{ color: 'var(--ink)' }}>
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                  style={{ background: 'var(--plum-50)', color: 'var(--plum)' }}>
                  {userName?.charAt(0).toUpperCase() || 'U'}
                </div>
                <span className="hidden sm:block">{userName}</span>
                <ChevronDown className="w-4 h-4" />
              </button>
              {userMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 rounded-2xl shadow-xl border py-1.5 z-50"
                  style={{ background: 'white', borderColor: 'var(--g100)' }}>
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
              <Link href="/auth/register"><Button variant="primary" size="sm">Get started free</Button></Link>
            </div>
          )}
          <button className="md:hidden p-2" style={{ color: 'var(--ink)' }}
            onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="absolute top-[68px] left-0 right-0 border-t px-4 py-3 space-y-1"
          style={{ background: 'var(--cream)', borderColor: 'var(--g100)' }}>
          <Link href="/nurse/jobs" className="block px-3 py-2 rounded-lg text-sm no-underline" style={{ color: 'var(--g600)' }} onClick={() => setMobileOpen(false)}>Browse Jobs</Link>
          <Link href="/auth/register/hospital" className="block px-3 py-2 rounded-lg text-sm no-underline" style={{ color: 'var(--g600)' }} onClick={() => setMobileOpen(false)}>For Hospitals</Link>
          <Link href="/about" className="block px-3 py-2 rounded-lg text-sm no-underline" style={{ color: 'var(--g600)' }} onClick={() => setMobileOpen(false)}>About</Link>
          <Link href="/contact" className="block px-3 py-2 rounded-lg text-sm no-underline" style={{ color: 'var(--g600)' }} onClick={() => setMobileOpen(false)}>Contact</Link>
          {links.map(link => (
            <Link key={link.href} href={link.href} className="block px-3 py-2 rounded-lg text-sm no-underline" style={{ color: 'var(--g600)' }} onClick={() => setMobileOpen(false)}>{link.label}</Link>
          ))}
          {!userRole && (
            <div className="pt-2 flex gap-2">
              <Link href="/auth/login" className="flex-1"><Button variant="outline" size="sm" className="w-full">Log in</Button></Link>
              <Link href="/auth/register" className="flex-1"><Button variant="primary" size="sm" className="w-full">Get started</Button></Link>
            </div>
          )}
        </div>
      )}
    </nav>
  )
}
