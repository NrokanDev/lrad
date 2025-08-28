'use client'
import { useState } from "react"
import { createUser } from "@/action/saveUser"

export default function SignupPage() {
  const [error, setError] = useState("")

  const handleSubmit = async (formData) => {
    try {
      await createUser(formData)
    } catch (err) {
      setError(err.message || "Something went wrong") // เช่น "Email already exists"
    }
  }

  return (
    <div className="flex justify-center items-center mt-40 bg-[#E7E2FF]">
      <div className="bg-white p-8 rounded-lg shadow-lg w-[500px] h-[400px]">
        <h2 className="text-2xl font-bold mb-6 text-center">Sign Up</h2>

        {/* Alert */}
        {error && (
          <div className="bg-red-100 text-red-700 px-4 py-2 rounded mb-4 text-center">
            {error}
          </div>
        )}

        <form
          action={handleSubmit} 
          className="flex flex-col gap-4"
        >
          <input
            type="email"
            name="email"
            placeholder="Email"
            className="rounded-xl placeholder-black font-semibold bg-[#F3F1FF] px-3 py-2"
            required
          />
          <input
            type="password"
            name="password"
            placeholder="Password"
            className="rounded-xl placeholder-black font-semibold bg-[#F3F1FF] px-3 py-2"
            required
          />
          <input
            type="text"
            name="name"
            placeholder="Name"
            className="rounded-xl placeholder-black font-semibold bg-[#F3F1FF] px-3 py-2"
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
              Sign Up
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
