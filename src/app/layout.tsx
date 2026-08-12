// layout.tsx copied
import './globals.css'

export const metadata = {
  title: 'Home App',
  description: 'Home application'
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
