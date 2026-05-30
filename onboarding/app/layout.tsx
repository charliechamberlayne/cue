import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Cue — Build your wiki',
  description: 'Generate a meeting-ready company wiki for investor calls.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
