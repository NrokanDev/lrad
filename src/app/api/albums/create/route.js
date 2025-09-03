import prisma from "@/lib/prisma"; // เชื่อม MongoDB

export async function POST(req) {
  const { title, userId } = await req.json();

  if (!title || !userId) {
    return new Response(JSON.stringify({ error: "Missing title or userId" }), { status: 400 });
  }

  try {
    const album = await prisma.albums.create({
      data: {
        title,
        userId,
      },
    });

    return new Response(JSON.stringify(album), { status: 201 });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: "Failed to create album" }), { status: 500 });
  }
}
