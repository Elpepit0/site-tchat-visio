import { useState, useEffect, useRef } from 'react';

export default function AvatarUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string>("");
  const [preview, setPreview] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Récupère l'avatar actuel au chargement
  useEffect(() => {
    fetch('/me', { credentials: 'include' })
      .then(res => res.json())
      .then(data => setAvatarUrl(data.avatar_url || ""))
      .catch(() => {});
  }, []);

  // Affiche un aperçu local quand un fichier est choisi
  useEffect(() => {
    if (!file) {
      setPreview("");
      return;
    }
    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setMessage(null);
    }
  };

  const handleChooseFile = () => {
    inputRef.current?.click();
  };

  const uploadFile = async () => {
    if (!file) return;
    setLoading(true);
    setMessage(null);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/upload-avatar", {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      const data = await res.json();
      if (data.url) {
        setAvatarUrl(data.url);
        setFile(null);
        setPreview("");
        setMessage({ type: "success", text: "Avatar mis à jour !" });
        setTimeout(() => setMessage(null), 2000);
        window.location.reload();
      } else {
        setMessage({ type: "error", text: data.error || "Erreur upload" });
      }
    } catch {
      setMessage({ type: "error", text: "Erreur réseau" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4 p-6 bg-[#36393f] rounded-xl shadow-lg w-full max-w-xs mx-auto">
      <div className="relative group">
        <img
          src={preview || avatarUrl || "/default-avatar.jpg"}
          alt="avatar"
          width={120}
          height={120}
          className="rounded-full shadow-lg border-4 border-indigo-100 object-cover transition group-hover:brightness-90"
          style={{ aspectRatio: "1/1" }}
        />
        <button
          type="button"
          onClick={handleChooseFile}
          className="absolute bottom-2 right-2 bg-indigo-600 text-white rounded-full p-2 shadow-lg hover:bg-indigo-700 transition"
          title="Changer l'avatar"
        >
          <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M15.232 5.232l3.536 3.536M9 13l6-6m2 2l-6 6m-2 2H5v-2l9-9a2 2 0 112.828 2.828l-9 9z"/>
          </svg>
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>
      {file && (
        <div className="text-sm text-gray-500">{file.name}</div>
      )}
      <button
        onClick={uploadFile}
        disabled={!file || loading}
        className={`w-full py-2 rounded-lg font-semibold transition 
          ${file && !loading ? "bg-indigo-600 hover:bg-indigo-700 text-white shadow" : "bg-gray-200 text-gray-400 cursor-not-allowed"}
        `}
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
            </svg>
            Upload...
          </span>
        ) : "Mettre à jour l'avatar"}
      </button>
      {message && (
        <div className={`text-center text-sm mt-2 ${message.type === "success" ? "text-green-600" : "text-red-600"}`}>
          {message.text}
        </div>
      )}
    </div>
  );
}

