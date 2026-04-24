'use client'
export const dynamic = 'force-dynamic'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import Navbar from '@/components/layout/Navbar'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { formatDate } from '@/lib/utils'
import { ArrowLeft, Send, MessageSquare } from 'lucide-react'

interface Message {
  id: string
  sender_id: string
  body: string
  created_at: string
  read_at: string | null
}

export default function ConversationPage() {
  const { id } = useParams()
  const router = useRouter()
  const supabase = createClient()

  const [userId, setUserId] = useState<string | null>(null)
  const [userRole, setUserRole] = useState<'nurse' | 'hospital' | 'admin' | null>(null)
  const [userName, setUserName] = useState<string | null>(null)
  const [application, setApplication] = useState<any>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [draft, setDraft] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth/login'); return }
      setUserId(user.id)

      const { data: profile } = await supabase
        .from('users')
        .select('role, email')
        .eq('id', user.id)
        .single()

      setUserRole(profile?.role || null)
      setUserName(profile?.email?.split('@')[0] || null)

      const { data: app } = await supabase
        .from('applications')
        .select('id, status, nurse_profiles(full_name, user_id), job_postings(title, employer_profiles(org_name, user_id))')
        .eq('id', id as string)
        .single()

      if (!app) { router.push('/messages'); return }
      setApplication(app)

      const { data: msgs } = await supabase
        .from('messages')
        .select('*')
        .eq('application_id', id as string)
        .order('created_at', { ascending: true })

      setMessages(msgs || [])

      const unreadIds = (msgs || [])
        .filter(m => m.sender_id !== user.id && !m.read_at)
        .map(m => m.id)

      if (unreadIds.length > 0) {
        await supabase
          .from('messages')
          .update({ read_at: new Date().toISOString() })
          .in('id', unreadIds)
      }

      setLoading(false)
    }
    load()
  }, [id])

  useEffect(() => {
    if (!application || !userId) return
    const channel = supabase.channel(`messages:${id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `application_id=eq.${id}`,
      }, (payload: any) => {
        const newMsg = payload.new as Message
        setMessages(prev => prev.some(m => m.id === newMsg.id) ? prev : [...prev, newMsg])
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [application, userId, id])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length])

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault()
    if (!draft.trim() || sending) return
    setSending(true)
    setError('')

    const res = await fetch('/api/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ applicationId: id, body: draft }),
    })
    const data = await res.json()

    if (!res.ok) {
      setError(data.error || 'Failed to send')
      setSending(false)
      return
    }

    setDraft('')
    if (data.message) {
      setMessages(prev => prev.some(m => m.id === data.message.id) ? prev : [...prev, data.message])
    }
    setSending(false)
  }

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen" style={{ background: 'var(--cream)' }}>
        <Navbar userRole={userRole} userName={userName} />
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin w-8 h-8 border-4 rounded-full"
            style={{ borderColor: 'var(--plum)', borderTopColor: 'transparent' }} />
        </div>
      </div>
    )
  }

  if (!application) return null

  const peerName = userRole === 'nurse'
    ? application.job_postings?.employer_profiles?.org_name || 'Hospital'
    : application.nurse_profiles?.full_name || 'Nurse'
  const jobTitle = application.job_postings?.title

  return (
    <div className="flex flex-col min-h-screen" style={{ background: 'var(--cream)' }}>
      <Navbar userRole={userRole} userName={userName} />

      <main className="flex-1 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full flex flex-col">
        <Link href="/messages" className="inline-flex items-center gap-1.5 text-sm font-medium no-underline mb-4"
          style={{ color: 'var(--plum)' }}>
          <ArrowLeft className="w-3.5 h-3.5" /> All messages
        </Link>

        {/* Header card */}
        <Card className="mb-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="font-semibold text-lg" style={{ color: 'var(--ink)' }}>{peerName}</h1>
              <p className="text-xs" style={{ color: 'var(--g600)' }}>
                About: <span className="font-medium">{jobTitle}</span>
              </p>
            </div>
            {userRole === 'hospital' && (
              <Link href={`/hospital/applicants/${application.id}`}
                className="text-xs font-semibold no-underline" style={{ color: 'var(--plum)' }}>
                View application →
              </Link>
            )}
          </div>
        </Card>

        {/* Messages list */}
        <Card className="flex-1 mb-4 min-h-[400px]">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center py-10">
              <MessageSquare className="w-10 h-10 mb-3" style={{ color: 'var(--g400)' }} />
              <p className="text-sm" style={{ color: 'var(--g600)' }}>No messages yet — say hello.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {messages.map(m => {
                const isMine = m.sender_id === userId
                return (
                  <div key={m.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                    <div className="max-w-[75%]">
                      <div className="rounded-2xl px-4 py-2.5 text-sm"
                        style={{
                          background: isMine ? 'var(--plum)' : 'var(--cream-mid)',
                          color: isMine ? 'white' : 'var(--ink)',
                        }}>
                        {m.body}
                      </div>
                      <p className="text-[10px] mt-1 px-1" style={{ color: 'var(--g400)', textAlign: isMine ? 'right' : 'left' }}>
                        {formatDate(m.created_at)}
                      </p>
                    </div>
                  </div>
                )
              })}
              <div ref={bottomRef} />
            </div>
          )}
        </Card>

        {/* Composer */}
        <form onSubmit={sendMessage} className="flex items-end gap-2">
          <textarea
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                sendMessage(e)
              }
            }}
            rows={2}
            placeholder="Write a message…"
            className="flex-1 rounded-2xl border px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2"
            style={{ borderColor: 'var(--g200)', background: 'white', color: 'var(--ink)' }}
          />
          <Button type="submit" loading={sending} disabled={!draft.trim()} size="lg">
            <Send className="w-4 h-4" />
          </Button>
        </form>
        {error && <p className="text-xs mt-2" style={{ color: 'var(--tang-mid)' }}>{error}</p>}
      </main>
    </div>
  )
}
