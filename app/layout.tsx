import type { Metadata } from 'next'
import { DM_Sans } from 'next/font/google'
import './globals.css'

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500'],
  variable: '--font-dm-sans',
})

export const metadata: Metadata = {
  title: 'Cléo — Service de garde de clés · Paris',
  description: 'Cléo conserve vos clés dans un espace sécurisé à Paris et vous les restitue sur demande.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr">
      <body className={`${dmSans.variable} font-sans bg-cream text-navy`}>
        {children}
      </body>
    </html>
  )
}
