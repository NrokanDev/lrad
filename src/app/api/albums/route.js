import prisma from "@/lib/prisma";

export async function GET(req) {
  const userId = req.url.includes("userId=") ? new URL(req.url).searchParams.get("userId") : null;

  if (!userId) {
    return new Response(JSON.stringify({ error: "Missing userId" }), { status: 400 });
  }

  try {
    const albums = await prisma.albums.findMany({
      where: { userId },
    });

    return new Response(JSON.stringify(albums), { status: 200 });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: "Failed to fetch albums" }), { status: 500 });
  }
}
