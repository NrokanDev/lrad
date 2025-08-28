'use server'
import prisma from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { redirect } from "next/navigation"

export const createUser = async (formData) => {
  const email = formData.get("email")
  const password = formData.get("password")
  const name = formData.get("name")

  const existing = await prisma.users.findUnique({
    where: { email },
  })

  if (existing) {
    redirect("/sign-up?error=email-exists")
  }

  const hashedPassword = await bcrypt.hash(password, 10)

    await prisma.users.create({
    data: {
      email,
      password: hashedPassword,
      name,
    },
  })
  redirect("/")
}

export const fetchUser = async () => {
  const users = await prisma.users.findMany()
  return users
}
