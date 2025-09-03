'use client'
import { SessionProvider } from "next-auth/react"

export default function MyProjectLayout({ children }) {
  return (
    <SessionProvider>
      <div className="min-h-screen bg-[#E7E2FF]">
        {children}
      </div>
    </SessionProvider>
  )
}