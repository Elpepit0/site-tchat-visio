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
    <div className="flex flex-col items-center gap-3 bg-[#23272a] rounded-xl p-4 shadow">
      <img
        src={avatarUrl || "/default-avatar.jpg"}
        alt="avatar"
        className="w-20 h-20 rounded-full border-4 border-indigo-500 shadow-lg mb-2 bg-[#36393f] object-cover"
      />
      <input
        type="url"
        value={avatarUrl}
        onChange={e => setAvatarUrl(e.target.value)}
        placeholder="URL de l’avatar"
        className="border border-[#36393f] bg-[#2f3136] text-gray-200 rounded px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-indigo-500"
      />
      <button
        onClick={handleSave}
        disabled={saving}
        className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition text-sm font-semibold mt-1 w-full disabled:opacity-50"
      >
        {saving ? "Sauvegarde..." : "Sauvegarder"}
      </button>
    </div>
  );
}

export default AvatarChanger;