'use client'
import { signOut } from "next-auth/react"

export default function SignOutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: "/" })}
      className="bg-gradient-to-r from-purple-400 via-purple-500 to-purple-600 text-white px-3 py-1 rounded-full hover:from-purple-500 hover:via-purple-600 hover:to-purple-700 transition-colors"
    >
      Sign Out
    </button>
  )
}