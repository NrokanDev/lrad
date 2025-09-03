'use client'
import { SessionProvider } from "next-auth/react"

export default function AddAlbumLayout({ children }) {
  return (
    <SessionProvider>
      {children}
    </SessionProvider>
  )
}
