import { useState } from "react";

interface AvatarChangerProps {
  currentAvatar?: string;
  onAvatarChange: (url: string) => void;
}

function AvatarChanger({ currentAvatar, onAvatarChange }: AvatarChangerProps) {
  const [avatarUrl, setAvatarUrl] = useState(currentAvatar || "");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await fetch("/set_avatar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ avatar_url: avatarUrl }),
    });
    setSaving(false);
    onAvatarChange(avatarUrl);
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <img
        src={avatarUrl || "/default-avatar.jpg"}
        alt="avatar"
        className="w-20 h-20 rounded-full border-2 border-indigo-400 shadow mb-2"
      />
      <input
        type="url"
        value={avatarUrl}
        onChange={e => setAvatarUrl(e.target.value)}
        placeholder="URL de l’avatar"
        className="border border-indigo-300 rounded px-2 py-1 text-sm w-full"
      />
      <button
        onClick={handleSave}
        disabled={saving}
        className="bg-indigo-600 text-white px-4 py-1 rounded hover:bg-indigo-700 transition text-sm font-semibold mt-1 disabled:opacity-50"
      >
        {saving ? "Sauvegarde..." : "Sauvegarder"}
      </button>
    </div>
  );
}

export default AvatarChanger;