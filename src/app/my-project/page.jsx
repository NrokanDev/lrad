"use client"
import Link from 'next/link'
import React, { useEffect, useState } from 'react'
import { useSession } from "next-auth/react"

const fetchAlbumsByUser = async (userId) => {
  const res = await fetch(`/api/albums?userId=${userId}`)
  if (!res.ok) return []
  return await res.json()
}

const MyProject = () => {
  const { data: session } = useSession()
  const [albums, setAlbums] = useState([])

  useEffect(() => {
    if (session?.user?.id) {
      fetchAlbumsByUser(session.user.id).then(setAlbums)
    }
  }, [session])

  // ฟังก์ชันลบ Album
  const handleDeleteAlbum = async (albumId) => {
    if (!confirm("ลบอัลบั้มนี้? จะลบทุกรูปในอัลบั้มด้วย")) return;
    try {
      const res = await fetch(`/api/albums/delete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ albumId }),
      });
      const data = await res.json();
      if (res.ok) {
        setAlbums(prev => prev.filter(a => a.id !== albumId));
      } else {
        alert(data.error || "ลบอัลบั้มไม่สำเร็จ");
      }
    } catch (err) {
      alert("ลบอัลบั้มไม่สำเร็จ");
    }
  };

  return (
    <div className="flex justify-center items-center m-12">
      <div className="bg-gray-50 border rounded-2xl shadow-2xl w-[1000px] min-h-[400px] p-8 
                      flex flex-wrap justify-center items-center gap-6">

        {/* New Album */}
        <Link href={"/add-album"}>
          <div className='w-[150px] h-[150px] flex flex-col items-center justify-center 
                        shadow-2xl rounded-2xl hover:scale-105 hover:cursor-pointer hover:bg-gray-200 transition-all duration-200'>
            <p className='text-4xl'>+</p>
            <p>New Album</p>
          </div>
        </Link>

        {/* Show user's albums */}
        {albums.length === 0 ? (
          <div className="text-gray-400 text-center w-full mt-8">ยังไม่มีอัลบั้ม</div>
        ) : (
          albums.map(album => (
            <div key={album.id} className="relative group w-[150px] h-[150px]">
              <Link href={`/album/${album.id}`}>
                <div className='w-full h-full flex flex-col items-center justify-center 
                      shadow-2xl rounded-2xl bg-white hover:scale-105 hover:cursor-pointer hover:bg-gray-200 transition-all duration-200'>
                  <p className='text-lg font-bold'>{album.title}</p>
                </div>
              </Link>
              {/* ปุ่มลบ */}
              <button
                onClick={() => handleDeleteAlbum(album.id)}
                className="absolute top-1 right-1 bg-red-500 text-white rounded-full cursor-pointer w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
              >
                ×
              </button>
            </div>
          ))
        )}

      </div>
    </div>
  )
}

export default MyProject
