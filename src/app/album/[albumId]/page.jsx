"use client";
import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";

const toneMap = { "งานแต่ง": "wedding", "งานบวช": "buat", "พอร์ต-รับปริญญา": "portfolio" };

// อ่าน JSON แบบกันเคส body ว่าง/ไม่ใช่ JSON
async function readJsonOrThrow(res) {
  const text = await res.text();
  if (!res.ok) throw new Error(text || `HTTP ${res.status} ${res.statusText}`);
  try { return JSON.parse(text || "null"); }
  catch { throw new Error("Invalid JSON from server: " + text.slice(0, 200)); }
}

export default function AlbumDetail() {
  const { albumId } = useParams();

  const [photos, setPhotos] = useState([]);            // [{id,url,afterUrl?}]
  const [toneUi, setToneUi] = useState("งานแต่ง");
  const [pred, setPred] = useState({});                // { [id]: {status, vals?, afterImage?, err?} }
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [banner, setBanner] = useState(null);          // แถบแจ้งเตือนด้านบน
  const [deletingIds, setDeletingIds] = useState(new Set()); // track รูปที่กำลังลบ
  const controllersRef = useRef([]);

  // อุ่น (ping) route อัปโหลด เพื่อกันเคส 405/แคชเพิ่งคอมไพล์
  const pingUploadRoute = async () => {
    try { await fetch("/api/photos/upload", { method: "GET", cache: "no-store" }); } catch {}
  };

  // โหลดรูปจาก DB เมื่อเข้าเพจ + อุ่น route อัปโหลด
  useEffect(() => {
    (async () => {
      if (!albumId) return;
      try {
        await pingUploadRoute();
        const res = await fetch(`/api/photos/${albumId}`, { cache: "no-store" });
        const data = await readJsonOrThrow(res);
        setPhotos(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error("load photos error:", e);
        setBanner("โหลดรูปจากอัลบั้มไม่สำเร็จ");
      }
    })();
  }, [albumId]);

  // cleanup abort
  useEffect(() => {
    return () => { controllersRef.current.forEach((c) => c.abort?.()); };
  }, []);

  // อัปโหลดหลายไฟล์ -> เซฟจริง + บันทึก DB
  const handleSelectFiles = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const temps = files.map((file) => {
      const url = URL.createObjectURL(file);
      return { id: crypto.randomUUID(), url, _temp: true, _file: file, _revoke: url, _status: "uploading" };
    });
    setPhotos((prev) => [...temps, ...prev]);

    await pingUploadRoute();

    for (const t of temps) {
      try {
        const fd = new FormData();
        fd.append("file", t._file);
        fd.append("albumId", albumId);

        const res = await fetch(`/api/photos/upload`, { method: "POST", body: fd });
        const saved = await readJsonOrThrow(res);

        // แทนที่ temp ด้วยข้อมูลจริงจาก DB (รองรับ afterUrl ถ้ามี)
        setPhotos((prev) =>
          prev.map((p) => (p.id === t.id ? { id: saved.id, url: saved.url, afterUrl: saved.afterUrl || null } : p))
        );
      } catch (err) {
        setPhotos((prev) => prev.filter((p) => p.id !== t.id));
        console.error("upload one failed:", err);
        setBanner("อัปโหลดรูปบางไฟล์ไม่สำเร็จ");
      } finally {
        if (t._revoke) URL.revokeObjectURL(t._revoke);
      }
    }

    e.target.value = "";
  };

  // ทำนายค่ารูปเดียว
  const predictOne = async (photo, { returnImage = 0 } = {}) => {
    const ctrl = new AbortController();
    controllersRef.current.push(ctrl);
    setPred((p) => ({ ...p, [photo.id]: { status: "predicting" } }));

    try {
      const imgRes = await fetch(photo.url, { signal: ctrl.signal });
      if (!imgRes.ok) throw new Error("fetch image failed");
      const blob = await imgRes.blob();
      const fileForSend = new File([blob], `${photo.id}.jpg`, { type: blob.type || "image/jpeg" });

      const fd = new FormData();
      fd.append("file", fileForSend);
      fd.append("tone", toneMap[toneUi]);
      fd.append("return_image", String(returnImage)); // 0: เร็ว, 1: ขอ afterImage

      const res = await fetch("http://127.0.0.1:8000/predict", { method: "POST", body: fd, signal: ctrl.signal });
      const data = await readJsonOrThrow(res);
      if (data.error) throw new Error(data.error);

      setPred((p) => ({
        ...p,
        [photo.id]: {
          status: "done",
          vals: {
            Exposure2012: data.Exposure2012,
            Contrast2012: data.Contrast2012,
            Highlights2012: data.Highlights2012,
            Shadows2012: data.Shadows2012,
          },
          afterImage: data.afterImage, // จะมีเมื่อ returnImage=1
        },
      }));
    } catch (e) {
      setPred((p) => ({ ...p, [photo.id]: { status: "error", err: e.message } }));
    }
  };

  // เซฟ After ลงดิสก์ + DB (เรียกหลัง predict สำเร็จ ถ้าต้องการ)
  const saveAfterToDisk = async (photo, predVals, afterDataUrl) => {
    try {
      const saveRes = await fetch("/api/photos/save-after", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          photoId: photo.id,
          albumId,
          afterImage: afterDataUrl,
          exposure: predVals.Exposure2012,
          contrast: predVals.Contrast2012,
          highlights: predVals.Highlights2012,
          shadows: predVals.Shadows2012,
        }),
      });
      const saved = await readJsonOrThrow(saveRes);
      setPhotos((prev) =>
        prev.map((p) => (p.id === photo.id ? { ...p, afterUrl: saved.afterUrl } : p))
      );
    } catch (e) {
      console.error("save-after failed:", e);
    }
  };

  // ทำนายทั้งอัลบั้มแบบจำกัดความขนาน
  const trainAll = async () => {
    if (photos.length === 0) return;
    setRunning(true);
    setProgress(0);

    const CONCURRENCY = 3;
    for (let i = 0; i < photos.length; i += CONCURRENCY) {
      const batch = photos.slice(i, i + CONCURRENCY);
      await Promise.allSettled(batch.map((ph) => predictOne(ph, { returnImage: 0 })));
      setProgress(Math.round(((i + batch.length) / photos.length) * 100));
    }
    setRunning(false);
  };

  const previewAfter = (photo) => predictOne(photo, { returnImage: 1 });

  const closePreview = (photoId) => {
    setPred((p) => {
      const current = p[photoId] || {};
      return { ...p, [photoId]: { ...current, afterImage: undefined } };
    });
  };

  // ✅ ลบรูป: รองรับ temp (ยังไม่เซฟ DB) และรูปจริง
  const deletePhoto = async (photo) => {
    // ถ้ายังเป็น temp (ยังไม่อัปโหลดจริง) แค่ลบออกจาก state
    if (photo._temp) {
      if (photo._revoke) URL.revokeObjectURL(photo._revoke);
      setPhotos((prev) => prev.filter((p) => p.id !== photo.id));
      return;
    }

    // รูปจริง: เรียก API ลบ
    const next = new Set(Array.from(deletingIds)); next.add(photo.id);
    setDeletingIds(next);
    try {
      const res = await fetch("/api/photos/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ photoId: photo.id, albumId }),
      });
      const data = await readJsonOrThrow(res);
      if (!data?.ok) throw new Error("ลบรูปไม่สำเร็จ");
      // ลบออกจาก state
      setPhotos((prev) => prev.filter((p) => p.id !== photo.id));
      // เคลียร์ pred state ของรูปนั้น
      setPred((prev) => {
        const n = { ...prev }; delete n[photo.id]; return n;
      });
    } catch (e) {
      console.error("delete photo error:", e);
      setBanner("ลบรูปไม่สำเร็จ");
    } finally {
      setDeletingIds((s) => {
        const t = new Set(Array.from(s)); t.delete(photo.id); return t;
      });
    }
  };

  const onClickDelete = (photo) => {
    if (deletingIds.has(photo.id)) return;
    if (confirm("ต้องการลบรูปนี้หรือไม่?")) {
      deletePhoto(photo);
    }
  };

  return (
    <div className="p-12 m-4">
      {/* แบนเนอร์แจ้งเตือน */}
      {banner && (
        <div className="mb-4 rounded-lg bg-yellow-100 text-yellow-900 px-4 py-2">
          {banner}
          <button className="float-right text-sm" onClick={() => setBanner(null)}>ปิด</button>
        </div>
      )}

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        {/* อัปโหลดหลายไฟล์ */}
        <div className="flex items-center gap-2">
          <input
            id="file-uploader"
            type="file"
            className="hidden"
            accept="image/jpeg,image/jpg,.jpg,.jpeg"
            multiple
            onChange={handleSelectFiles}
          />
          <label
            htmlFor="file-uploader"
            className="cursor-pointer px-4 py-2 rounded-xl bg-purple-800 text-white hover:opacity-90"
          >
            + เพิ่มรูปภาพ
          </label>
          <span className="text-sm text-gray-600">อัปโหลดแล้วจะถูกบันทึกลงฐานข้อมูลทันที</span>
        </div>

        {/* เลือก Tone */}
        <div className="flex items-center gap-2 ml-auto">
          <span className="bg-white me-1 p-1 rounded">Tone:</span>
          <select
            value={toneUi}
            onChange={(e) => setToneUi(e.target.value)}
            className="border rounded px-2 py-1 bg-white"
          >
            <option>งานแต่ง</option>
            <option>งานบวช</option>
            <option>พอร์ต-รับปริญญา</option>
          </select>
        </div>

        {/* Predict All */}
        <button
          disabled={running || photos.length === 0}
          onClick={trainAll}
          className="px-4 py-2 rounded-xl bg-purple-600 text-white disabled:opacity-50"
        >
          Predict All & Save
        </button>

        {running && (
          <div className="flex items-center gap-2">
            <div className="w-64 h-3 bg-gray-200 rounded overflow-hidden">
              <div className="h-3 bg-purple-500" style={{ width: `${progress}%` }} />
            </div>
            <span className="text-sm">{progress}%</span>
          </div>
        )}
      </div>

      {/* Grid 5 คอลัมน์, ไม่ครอปรูป */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {photos.map((photo) => {
          const p = pred[photo.id];
          const isDeleting = deletingIds.has(photo.id);

          return (
            <div key={photo.id} className="border rounded-2xl p-2 bg-white/70">
              {/* กล่องรูป + ปุ่มลบมุมขวาบน */}
              <div className="relative w-full aspect-[3/2] bg-gray-100 rounded-xl overflow-hidden flex items-center justify-center">
                <img src={photo.url} alt="" className="w-full h-full object-contain" />
                <button
                  onClick={() => onClickDelete(photo)}
                  disabled={isDeleting}
                  className="absolute top-1 right-1 w-8 h-8 rounded-full bg-red-600/90 text-white text-sm flex items-center justify-center hover:bg-red-700 disabled:opacity-60"
                  title="ลบรูปนี้"
                  aria-label="ลบรูปนี้"
                >
                  {isDeleting ? "…" : "🗑"}
                </button>
              </div>

              <div className="flex gap-2 mt-2">
                <button
                  onClick={() => previewAfter(photo)}
                  className="px-3 py-1 rounded bg-gray-800 text-white text-xs"
                >
                  Preview After
                </button>
              </div>

              <div className="mt-2 text-xs">
                {p?.status === "predicting" && <span className="text-gray-500">Predicting...</span>}
                {p?.status === "error" && <span className="text-red-600">Error: {p.err}</span>}
                {p?.vals && (
                  <ul className="mt-1 space-y-0.5">
                    <li>Exposure: {p.vals.Exposure2012}</li>
                    <li>Contrast: {p.vals.Contrast2012}</li>
                    <li>Highlights: {p.vals.Highlights2012}</li>
                    <li>Shadows: {p.vals.Shadows2012}</li>
                  </ul>
                )}
              </div>

              {/* แสดง After: ใช้ไฟล์จริงถ้ามี ไม่งั้นใช้ preview */}
              {(photo.afterUrl || p?.afterImage) && (
                <div className="relative mt-2 group">
                  <img src={photo.afterUrl || p.afterImage} alt="After" className="w-full rounded-lg" />
                  <button
                    onClick={() => closePreview(photo.id)}
                    className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/70 text-white text-xs flex items-center justify-center hover:bg-black opacity-0 group-hover:opacity-100 transition"
                    title="ปิดพรีวิว"
                    aria-label="Close preview"
                  >
                    ×
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
