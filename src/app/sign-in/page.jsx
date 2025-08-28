'use client'
import { signIn } from "next-auth/react"
import { useState } from "react"

export default function LoginPage() {
  const [error, setError] = useState("")

  const handleLogin = async (e) => {
    e.preventDefault()
    const formData = new FormData(e.target)
    const email = formData.get("email")
    const password = formData.get("password")

    const res = await signIn("credentials", {
      redirect: false,
      email,
      password,
    })

    if (res.error) setError(res.error)
    else window.location.href = "/"
  }

  return (
    <div className="flex justify-center items-center mt-40 bg-[#E7E2FF]">
      <div className="bg-white p-8 rounded-lg shadow-lg w-[500px] h-[400px]">
        <h2 className="text-2xl font-bold mb-6  text-center">Login</h2>

        {/* Alert */}
        {error && (
          <div className="bg-red-100 text-red-700 px-4 py-2 rounded mb-4 text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <input
            type="email"
            name="email"
            placeholder="Email"
            className="rounded-xl placeholder-black font-bold bg-[#F3F1FF] px-3 py-2"
            required
          />
          <input
            type="password"
            name="password"
            placeholder="Password"
            className="rounded-xl placeholder-black font-bold bg-[#F3F1FF] px-3 py-2"
            required
          />

          <div className="flex justify-center mt-4">
            <button
              type="submit"
              className="w-[40%] text-white py-2 rounded 
             bg-gradient-to-r from-purple-400 via-purple-500 to-purple-600
             hover:from-purple-500 hover:via-purple-600 hover:to-purple-700
             transition-colors"
            >
              Login
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
