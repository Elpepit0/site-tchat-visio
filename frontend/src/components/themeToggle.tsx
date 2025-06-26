import { useEffect, useState } from "react";

export function ThemeToggle() {
  const [dark, setDark] = useState(
    () => localStorage.getItem("theme") === "dark"
  );

  useEffect(() => {
    if (dark) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [dark]);

  return (
    <button
      onClick={() => setDark((d) => !d)}
      className="p-2 rounded-full border hover:bg-gray-200 dark:hover:bg-gray-700 transition"
      title="Changer de thème"
    >
      {dark ? "🌙" : "☀️"}
    </button>
  );
}