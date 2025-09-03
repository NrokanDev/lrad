"use client";
import { useParams } from "next/navigation";
import { useRef, useState, useEffect } from "react";

export default function AlbumDetail() {
  const { albumId } = useParams();
  const [albumName, setAlbumName] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [photos, setPhotos] = useState([]);
  const [tone, setTone] = useState("");
  const [results, setResults] = useState({});
  const [loadingAll, setLoadingAll] = useState(false);
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef(null);

  const toneMap = {
    งานแต่ง: "wedding",
    งานบวช: "buat",
    "พอร์ต-รับปริญญา": "portfolio",
  };

  const handleDivClick = () => {
    if (fileInputRef.current) fileInputRef.current.click();
  };

  const handleFileChange = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setError("");
    setUploading(true);

    try {
      for (const file of files) {
        const formData = new FormData();
        formData.append("albumId", albumId);
        formData.append("photo", file);

        const res = await fetch("/api/photos", {
          method: "POST",
          body: formData,
        });

        if (!res.ok) {
          setError("อัปโหลดรูป " + file.name + " ไม่สำเร็จ");
        }
      }

      await fetchPhotos();
    } catch (err) {
      setError("เกิดข้อผิดพลาดระหว่างอัปโหลด");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const fetchAlbum = async () => {
    try {
      const res = await fetch(`/api/albums/${albumId}`);
      const data = await res.json();
      if (res.ok) setAlbumName(data.album.title);
      else setError(data.error || "ไม่สามารถดึงชื่ออัลบั้มได้");
    } catch (err) {
      setError("ไม่สามารถดึงชื่ออัลบั้มได้");
    }
  };

  const fetchPhotos = async () => {
    try {
      const res = await fetch(`/api/photos/${albumId}`);
      const data = await res.json();
      if (res.ok) {
        setPhotos(data.photos);

        // ✅ preload results จาก DB
        const preload = {};
        data.photos.forEach((p) => {
          if (p.exposure !== null) {
            preload[p.id] = {
              Exposure2012: p.exposure,
              Contrast2012: p.contrast,
              Highlights2012: p.highlight,
              Shadows2012: p.shadow,
            };
          }
        });
        setResults(preload);
      } else setError(data.error || "เกิดข้อผิดพลาด");
    } catch (err) {
      setError("ไม่สามารถดึงรูปได้");
    }
  };

  const handleDeletePhoto = async (photoId) => {
    if (!confirm("ลบรูปนี้?")) return;
    try {
      const res = await fetch("/api/photos/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ photoId }),
      });
      const data = await res.json();
      if (res.ok) setPhotos((prev) => prev.filter((p) => p.id !== photoId));
      else alert(data.error || "ลบไม่สำเร็จ");
    } catch (err) {
      alert("ลบไม่สำเร็จ");
    }
  };

  // ✅ Predict 1 รูป + บันทึก DB
  const runPrediction = async (photo) => {
    try {
      const formData = new FormData();
      const blob = await fetch(photo.url).then((r) => r.blob());
      formData.append("file", blob, "image.jpg");
      formData.append("tone", toneMap[tone]);

      const res = await fetch("http://127.0.0.1:8000/predict", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (res.ok && !data.error) {
        setResults((prev) => ({ ...prev, [photo.id]: data }));

        // ⬇️ update DB
        await fetch("/api/photos/train", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            photoId: photo.id,
            exposure: data.Exposure2012,
            contrast: data.Contrast2012,
            highlight: data.Highlights2012,
            shadow: data.Shadows2012,
          }),
        });
      } else {
        console.error("Predict error:", data.error);
      }
    } catch (err) {
      console.error("Fetch error:", err);
    }
  };

  const runAllPredictions = async () => {
    if (!tone) {
      alert("กรุณาเลือก Tone ก่อน");
      return;
    }
    setLoadingAll(true);
    setProgress(0);
    for (let i = 0; i < photos.length; i++) {
      await runPrediction(photos[i]);
      setProgress(Math.round(((i + 1) / photos.length) * 100));
    }
    setLoadingAll(false);
  };

  useEffect(() => {
    fetchAlbum();
    fetchPhotos();
  }, [albumId]);

  return (
    <div className="flex flex-col items-center mt-12 bg-[#E7E2FF]">
      <div className="bg-white p-8 rounded-lg shadow-lg w-[60%] flex flex-col justify-center">
        {/* Upload */}
        <div
          className="w-full h-32 flex flex-col items-center justify-center border-2 border-dashed border-purple-400 rounded-xl cursor-pointer hover:bg-purple-50 transition mb-4"
          onClick={handleDivClick}
        >
          <p className="text-purple-600 font-semibold">
            Upload Image {albumName && `for "${albumName}"`}
          </p>
          <p className="text-gray-400 text-sm">คลิกเพื่อเลือกไฟล์รูป</p>
        </div>
        <input
          type="file"
          accept="image/*"
          ref={fileInputRef}
          style={{ display: "none" }}
          onChange={handleFileChange}
          multiple
          disabled={uploading}
        />
        {uploading && (
          <div className="text-gray-500 text-center">กำลังอัปโหลด...</div>
        )}
        {error && <div className="text-red-500 text-center">{error}</div>}

        {/* Tone Selector */}
        <div className="flex items-center justify-center">
          <div className="mt-5 p-1 bg-gray-50 border rounded-xl flex w-[450px]">
            <p className="p-2 rounded-xl">Select Tone</p>
            {["งานแต่ง", "งานบวช", "พอร์ต-รับปริญญา"].map((t) => (
              <button
                key={t}
                onClick={() => setTone(t)}
                className={`m-1 border p-1 rounded-xl border-gray-300 ${
                  tone === t ? "bg-gray-800 text-white" : "bg-white"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Train All */}
        <div className="flex flex-col items-center justify-center mt-3 w-full">
          <button
            onClick={runAllPredictions}
            disabled={loadingAll}
            className={`bg-purple-600 text-white p-2 rounded cursor-pointer w-[200px] ${
              loadingAll ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            {loadingAll ? "Processing..." : "Train All"}
          </button>

          {loadingAll && (
            <div className="w-full mt-4">
              <div className="w-full bg-gray-200 rounded-xl overflow-hidden h-6">
                <div
                  className="h-6 bg-purple-500 transition-all duration-300 ease-linear"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-sm mt-2 text-center">{progress}%</p>
            </div>
          )}
        </div>

        {/* Photos */}
        <div className="mt-6 grid grid-cols-3 gap-4">
          {photos.map((photo) => (
            <div
              key={photo.id}
              className="flex flex-col w-[70%] rounded overflow-hidden border"
            >
              <div className="relative w-full h-[200px] group">
                <img
                  src={photo.url}
                  alt={photo.caption || "Photo"}
                  className="w-full h-full object-cover"
                />
                <button
                  onClick={() => handleDeletePhoto(photo.id)}
                  className="absolute top-1 right-1 bg-red-500 text-white rounded-full 
                     cursor-pointer w-6 h-6 flex items-center justify-center 
                     opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                >
                  ×
                </button>
              </div>

              {/* Results */}
              <div className="p-2 text-xs bg-gray-100">
                {results[photo.id] ? (
                  <>
                    <p>Exposure: {results[photo.id].Exposure2012}</p>
                    <p>Contrast: {results[photo.id].Contrast2012}</p>
                    <p>Highlights: {results[photo.id].Highlights2012}</p>
                    <p>Shadows: {results[photo.id].Shadows2012}</p>
                  </>
                ) : (
                  <p className="text-gray-400">ยังไม่ได้ Predict</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
