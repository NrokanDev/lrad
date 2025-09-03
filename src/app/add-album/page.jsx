"use client";
import { useState } from "react";
import { createAlbum } from "@/action/saveAlbum";
import { useSession } from "next-auth/react";

export default function AddAlbum() {
  const [error, setError] = useState("");
  const { data: session, status } = useSession();

  const handleSubmit = async (formData) => {
    if (!session?.user?.id) {
      setError("กรุณาเข้าสู่ระบบก่อนเพิ่มอัลบั้ม");
      return;
    }
    try {
      await createAlbum(formData);
    } catch (err) {
      setError(err.message || "Something went wrong");
    }
  };

  if (status === "loading") {
    return (
      <div className="flex justify-center items-center min-h-screen bg-[#E7E2FF]">
        <div className="bg-white p-8 rounded-lg shadow-lg w-[500px] h-[200px] flex items-center justify-center">
          <span className="text-purple-700 font-semibold">กำลังโหลดข้อมูล...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-center items-center mt-12 ">
      <div className="bg-white p-8 rounded-lg shadow-lg w-[500px] min-h-[400px] flex flex-col justify-center">
        <h2 className="text-2xl font-bold mb-6 text-center">New Album</h2>

        {/* Alert */}
        {error && (
          <div className="bg-red-100 text-red-700 px-4 py-2 rounded mb-4 text-center">
            {error}
          </div>
        )}
        {!session?.user?.id ? (
          <div className="mb-2 text-center text-red-600 font-semibold">
            ไม่พบ userId กรุณาเข้าสู่ระบบก่อนเพิ่มอัลบั้ม
          </div>
        ) : null}
        <form
          action={handleSubmit}
          className="flex flex-col gap-4"
        >
          <input type="hidden" name="userId" value={session?.user?.id || ""} />

          <input
            type="text"
            name="title"
            placeholder="Name"
            className="rounded-xl placeholder-black font-semibold bg-[#F3F1FF] px-3 py-2"
            required
            disabled={!session?.user?.id}
          />

          <div className="flex justify-center mt-4">
            <button
              type="submit"
              className="w-[40%] text-white py-2 rounded 
             bg-gradient-to-r from-purple-400 via-purple-500 to-purple-600
             hover:from-purple-500 hover:via-purple-600 hover:to-purple-700
             transition-colors"
              disabled={!session?.user?.id}
            >
              Add Album
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
