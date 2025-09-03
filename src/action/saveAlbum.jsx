'use server'
import prisma from "@/lib/prisma"
import { redirect } from "next/navigation"

export const createAlbum = async (formData) => {
  const userId = formData.get("userId")
  const title = formData.get("title")

  if (!userId || !title) {
    redirect("/add-album?error=missing-fields")
  }

  await prisma.albums.create({
    data: {
      userId,
      title,
    },
  })
  redirect("/my-project")
}


export const fetchUser = async () => {
  const users = await prisma.users.findMany()
  return users
}
