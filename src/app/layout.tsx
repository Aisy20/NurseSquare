import type { Metadata } from 'next'
import { DM_Serif_Display, Sora } from 'next/font/google'
import './globals.css'

const serif = DM_Serif_Display({
  subsets: ['latin'],
  weight: ['400'],
  style: ['normal', 'italic'],
  variable: '--font-serif',
})

const sora = Sora({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
  variable: '--font-sora',
})

export const metadata: Metadata = {
  title: 'NurseSquare — Healthcare Staffing, Direct',
  description: 'Healthcare staffing without the middleman. Nurses keep more of every dollar. Hospitals fill roles for less.',
  keywords: 'travel nurse, nursing jobs, hospital staffing, 1099 nurse',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${sora.variable} ${serif.variable} antialiased min-h-screen flex flex-col`}>
        {children}
      </body>
    </html>
  )
}
